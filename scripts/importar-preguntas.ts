/**
 * scripts/importar-preguntas.ts
 *
 * Importador GENÉRICO de preguntas para Próximo Residente.
 * Lee un JSON con el formato de la skill `generar-preguntas` e inserta las
 * preguntas en la base, creando/reutilizando el TipoExamen por su código.
 *
 * Uso:
 *   npx tsx scripts/importar-preguntas.ts scripts/data/unal_2024.json
 *   npx tsx scripts/importar-preguntas.ts scripts/data/unal_2024.json --dry   (solo valida, no inserta)
 *
 * Formato de entrada (uno por examen+año):
 *   {
 *     "examen": "UNAL",              // código del TipoExamen (MAYÚSCULAS)
 *     "nombre": "UNAL",              // opcional: nombre a mostrar (si el examen es nuevo)
 *     "anio": 2024,
 *     "fuente": "Reconstrucción UNAL 2024",
 *     "preguntas": [ { enunciado, opciones:[{letra,texto}], respuesta_correcta,
 *                      especialidad, tema, subtema?, dificultad?, imagen_url?, video_url? } ]
 *   }
 *
 * Los campos internos que empiezan por "_" (_resuelta_por_ia, _confianza,
 * _revisar, _nota) se usan solo para el reporte y se descartan antes de insertar.
 *
 * Requisitos:
 *   - DATABASE_URL (o DIRECT_URL) en .env.local
 *
 * Es idempotente: reejecutarlo no duplica (salta preguntas cuyo enunciado ya
 * exista para ese examen).
 */

import fs from 'fs'
import path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import { normalizeEspecialidad, ESPECIALIDADES } from '../src/lib/constants'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  console.error('\n✗ Falta DATABASE_URL (o DIRECT_URL) en .env.local — no puedo conectar a la base.\n')
  process.exit(1)
}

const adapter = new PrismaPg(connectionString)
const prisma = new PrismaClient({ adapter } as any)

// Nombres "para mostrar" por defecto de los exámenes ya conocidos. Si el JSON
// trae `nombre`, ese gana. Si el examen es nuevo y no trae nombre, se usa el código.
// OJO: los códigos deben coincidir con los TipoExamen que YA existen en la base
// (verificados: CES, ELBOSQUE, ENARM, MIR, ROSARIO, UDEA, UNAL). Usa el código
// existente para no crear un examen duplicado.
const NOMBRES_CONOCIDOS: Record<string, string> = {
  UNAL: 'UNAL',
  ROSARIO: 'Rosario',
  ELBOSQUE: 'El Bosque',
  ENARM: 'ENARM',
  UDEA: 'UdeA',
  CES: 'CES',
  MIR: 'MIR',
  CALDAS: 'Caldas',
  CARTAGENA: 'Cartagena',
  FUCS: 'FUCS',
  UNIVALLE: 'Univalle',
  SABANA: 'Sabana',
  LIBRECALI: 'Libre Cali',
  UPB: 'UPB',
  JAVERIANA: 'Javeriana',
  SINU: 'UniSinú',
}

interface Opcion { letra: string; texto: string }
interface Pregunta {
  enunciado: string
  opciones: Opcion[]
  respuesta_correcta: string
  especialidad: string
  tema: string
  subtema?: string
  dificultad?: string
  imagen_url?: string
  video_url?: string
  anio?: number      // opcional por-pregunta (gana sobre el año del set)
  fuente?: string    // opcional por-pregunta (gana sobre la fuente del set)
  // campos internos (se descartan al insertar)
  _resuelta_por_ia?: boolean
  _confianza?: string
  _revisar?: boolean
  _nota?: string
  _recuperada?: boolean       // pregunta incompleta completada con distractores/respuesta IA
  _distractores_ia?: boolean
}
interface SetFile {
  examen: string
  nombre?: string
  descripcion?: string
  anio: number
  fuente: string
  preguntas: Pregunta[]
}

const CANONICAL = new Set<string>(ESPECIALIDADES as readonly string[])

// Normaliza variantes de dificultad al enum permitido (baja | media | alta).
function normDificultad(raw?: string): string {
  const v = (raw || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  if (['baja', 'facil', 'sencilla', 'basica'].includes(v)) return 'baja'
  if (['alta', 'dificil', 'compleja', 'avanzada'].includes(v)) return 'alta'
  if (['media', 'moderada', 'intermedia', 'normal', ''].includes(v)) return 'media'
  return 'media'
}

// Una pregunta de 2 opciones se acepta SOLO si es Verdadero/Falso (o Sí/No).
function esVerdaderoFalso(q: Pregunta): boolean {
  if (!Array.isArray(q.opciones) || q.opciones.length !== 2) return false
  const t = q.opciones.map((o) => (o?.texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim())
  const set = new Set(t)
  return (set.has('verdadero') && set.has('falso')) || (set.has('si') && set.has('no'))
}

function valida(q: Pregunta): string | null {
  if (!q.enunciado || q.enunciado.length < 20) return 'enunciado corto/ausente'
  const n = Array.isArray(q.opciones) ? q.opciones.length : 0
  const okLen = (n >= 4 && n <= 5) || (n === 2 && esVerdaderoFalso(q))
  if (!okLen) return `opciones=${n}`
  const letras = q.opciones.map((o) => o?.letra)
  if (q.opciones.some((o) => !o?.letra || !o?.texto)) return 'opción con letra/texto vacío'
  if (!/^[A-E]$/.test(q.respuesta_correcta || '')) return `respuesta_correcta="${q.respuesta_correcta}"`
  if (!letras.includes(q.respuesta_correcta)) return `respuesta ${q.respuesta_correcta} no está en opciones`
  if (!q.especialidad) return 'sin especialidad'
  if (!q.tema) return 'sin tema'
  if (q.dificultad && !['baja', 'media', 'alta'].includes(q.dificultad)) return `dificultad="${q.dificultad}"`
  return null
}

async function main() {
  const fileArg = process.argv[2]
  const dryRun = process.argv.includes('--dry')

  if (!fileArg) {
    console.error('\nUso: npx tsx scripts/importar-preguntas.ts <ruta-al-json> [--dry]\n')
    process.exit(1)
  }

  const fullPath = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg)
  if (!fs.existsSync(fullPath)) {
    console.error(`\n✗ No encuentro el archivo: ${fullPath}\n`)
    process.exit(1)
  }

  const data: SetFile = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))

  const codigo = (data.examen || '').trim().toUpperCase()
  if (!codigo) {
    console.error('\n✗ El JSON no trae "examen" (código del examen). Ej: "examen": "UNAL".\n')
    process.exit(1)
  }
  const nombre = data.nombre || NOMBRES_CONOCIDOS[codigo] || codigo

  console.log(`=== Importar preguntas — examen ${codigo} (${nombre}) ${data.anio} ===`)
  console.log(`Archivo: ${fullPath}`)
  console.log(`Fuente:  ${data.fuente}`)
  console.log(`Total en archivo: ${data.preguntas?.length ?? 0}${dryRun ? '   [DRY-RUN: no inserta]' : ''}\n`)

  // 1) Validación + normalización previa (no toca la base todavía)
  const validas: Pregunta[] = []
  let invalid = 0
  const paraRevisar: { i: number; nota?: string; conf?: string }[] = []

  data.preguntas.forEach((q, i) => {
    // normaliza especialidad al valor canónico de la app
    if (q.especialidad) {
      const canon = normalizeEspecialidad(q.especialidad)
      if (canon !== q.especialidad) {
        if (!CANONICAL.has(canon)) {
          console.warn(`  ⚠ #${i + 1} especialidad "${q.especialidad}" no es canónica y no se pudo normalizar`)
        }
        q.especialidad = canon
      }
    }
    q.dificultad = normDificultad(q.dificultad) // coacciona variantes (facil→baja, etc.)
    const err = valida(q)
    if (err) {
      invalid++
      console.warn(`  ⚠ inválida #${i + 1}: ${err} — "${q.enunciado?.slice(0, 50)}..."`)
      return
    }
    if (q._revisar) paraRevisar.push({ i: i + 1, nota: q._nota, conf: q._confianza })
    validas.push(q)
  })

  console.log(`\nVálidas: ${validas.length} | inválidas: ${invalid}`)
  const resueltasIA = validas.filter((q) => q._resuelta_por_ia).length
  if (resueltasIA) console.log(`De las válidas, ${resueltasIA} fueron resueltas por IA (documento sin respuesta marcada).`)
  const recuperadas = validas.filter((q) => q._recuperada).length
  const conDistractores = validas.filter((q) => q._distractores_ia).length
  if (recuperadas) console.log(`De las válidas, ${recuperadas} son RECUPERADAS de preguntas incompletas (${conDistractores} con distractores generados por IA) — todas requieren revisión humana.`)
  if (paraRevisar.length) {
    console.log(`\n⚑ ${paraRevisar.length} marcadas para revisión humana:`)
    for (const r of paraRevisar) console.log(`   - #${r.i}${r.conf ? ` (confianza ${r.conf})` : ''}${r.nota ? `: ${r.nota}` : ''}`)
  }

  if (dryRun) {
    console.log('\n[DRY-RUN] No se insertó nada. Quita --dry para subir a la base.\n')
    await prisma.$disconnect()
    return
  }

  // 2) TipoExamen (crea o reutiliza por código)
  const tipoExamen = await prisma.tipoExamen.upsert({
    where: { codigo },
    update: { nombre, descripcion: data.descripcion ?? undefined, activo: true },
    create: { codigo, nombre, descripcion: data.descripcion ?? null, activo: true },
  })
  console.log(`\nTipoExamen ${codigo} listo (id=${tipoExamen.id})`)

  // 3) Insertar (idempotente por enunciado + tipoExamen)
  let ins = 0, dup = 0
  for (const q of validas) {
    const existe = await prisma.pregunta.findFirst({
      where: { enunciado: q.enunciado, tipoExamen_id: tipoExamen.id },
      select: { id: true },
    })
    if (existe) { dup++; continue }

    await prisma.pregunta.create({
      data: {
        enunciado: q.enunciado,
        opciones: q.opciones as any,
        respuesta_correcta: q.respuesta_correcta,
        especialidad: q.especialidad,
        tema: q.tema,
        subtema: q.subtema || null,
        dificultad: q.dificultad || 'media',
        imagen_url: q.imagen_url || null,
        video_url: q.video_url || null,
        anio: q.anio ?? data.anio,      // año por-pregunta si viene; si no, el del set
        universidad: nombre,            // puente legacy: simulacro "por universidad"
        fuente: q.fuente ?? data.fuente,
        tipoExamen_id: tipoExamen.id,
      },
    })
    ins++
  }

  const totalExamen = await prisma.pregunta.count({ where: { tipoExamen_id: tipoExamen.id } })
  console.log(`\n=== Fin: ${ins} insertadas, ${dup} duplicadas (saltadas), ${invalid} inválidas ===`)
  console.log(`Total de preguntas de ${codigo} en la base ahora: ${totalExamen}\n`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
