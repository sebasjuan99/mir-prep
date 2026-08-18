/**
 * scripts/importar-generadas.ts
 *
 * Paso 2 de 2 del pipeline "completar universidades".
 *
 * Inserta en la base las preguntas ya reformuladas al estilo de una universidad,
 * marcándolas como generadas (`generada = true`) y enlazándolas a la pregunta de
 * reserva de la que salieron (`origen_pregunta_id`), para que:
 *   - se distingan siempre de las reconstrucciones reales,
 *   - ninguna pregunta de reserva se reutilice dos veces,
 *   - se puedan revertir en bloque si el resultado no convence.
 *
 * Formato de entrada: el mismo JSON que produce `preparar-lote-estilo.ts`, con
 * cada pregunta ya reescrita (mismo `origen_id`, distinto `enunciado`).
 *
 * Uso:
 *   npx tsx scripts/importar-generadas.ts scripts/data/lotes/sabana-lote-281.json --dry
 *   npx tsx scripts/importar-generadas.ts scripts/data/lotes/sabana-lote-281.json
 *   npx tsx scripts/importar-generadas.ts --revertir SABANA        # borra las generadas de ese examen
 */
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import { normalizeEspecialidad } from '../src/lib/constants'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!),
} as any)

const argv = process.argv.slice(2)
const DRY = argv.includes('--dry')
const REVERTIR = argv.indexOf('--revertir')
// Inserta en reserva: útil para cargarlas antes de desplegar el chip
// "PREGUNTA GENERADA", y liberarlas después con scripts/reserva.ts.
const OCULTO = argv.includes('--oculto')

type Opcion = { letra: string; texto: string }

const DIFICULTADES = new Set(['baja', 'media', 'alta'])
function normDificultad(d?: string) {
  const v = (d || 'media').toLowerCase().trim()
  if (DIFICULTADES.has(v)) return v
  if (v === 'facil' || v === 'fácil') return 'baja'
  if (v === 'dificil' || v === 'difícil') return 'alta'
  if (v === 'moderada') return 'media'
  return 'media'
}

/** Huella para detectar que la reformulación no es un copia-pega del original. */
function huella(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Detector de tildes comidas. El modelo a veces devuelve el texto sin acentos
 * ("cronica", "cual", "diagnostico"), que en una plataforma médica en español
 * se lee como una errata. Se buscan formas frecuentes que SIEMPRE llevan tilde.
 */
const SIN_TILDE = /\b(cual|cuales|cronic[ao]|seric[ao]|diagnostico|analisis|clinic[ao]|patologia|terapeutic[ao]|hemodialisis|cationic[ao]|anionic[ao]|electrocardiografic[ao]|ecografia|radiografia|tomografia|farmacologic[ao]|etiologia|epidemiologia|sindrome|quimic[ao]|hepatic[ao]|renal cronica|isquemic[ao]|hipoxic[ao]|anemic[ao]|toxic[ao]|gastric[ao]|higado|acido|basic[ao]|indice|numero|region|presion|infeccion|inflamacion|administracion|evaluacion|indicacion|complicacion|exploracion|intervencion|prevencion|deteccion|puncion|reaccion|funcion|solucion)\b/gi

function tildesComidas(texto: string) {
  return [...new Set((texto.match(SIN_TILDE) ?? []).map(w => w.toLowerCase()))]
}

/**
 * Comparación ESTRICTA para detectar opciones repetidas: sólo recorta y colapsa
 * espacios. No baja a minúsculas ni quita acentos a propósito — en genética
 * "F/f" y "f/f" son alelos distintos, y "β1"/"β2" o "Peso/altura" vs
 * "Peso/altura²" también. Normalizar de más fusiona opciones legítimas.
 */
function textoOpcion(t: string) {
  return t.replace(/\s+/g, ' ').trim()
}

/** Parecido por bigramas (Dice). Sirve para detectar que la respuesta correcta cambió de contenido. */
function parecido(a: string, b: string) {
  const bigramas = (x: string) => {
    const t = huella(x)
    const set = new Map<string, number>()
    for (let i = 0; i < t.length - 1; i++) {
      const g = t.slice(i, i + 2)
      set.set(g, (set.get(g) || 0) + 1)
    }
    return set
  }
  const A = bigramas(a), B = bigramas(b)
  if (!A.size || !B.size) return huella(a) === huella(b) ? 1 : 0
  let comunes = 0
  for (const [g, n] of A) comunes += Math.min(n, B.get(g) || 0)
  return (2 * comunes) / ([...A.values()].reduce((x, y) => x + y, 0) + [...B.values()].reduce((x, y) => x + y, 0))
}

async function revertir(codigo: string) {
  const tipo = await prisma.tipoExamen.findUnique({ where: { codigo } })
  if (!tipo) {
    console.error(`No existe el examen "${codigo}".`)
    process.exit(1)
  }
  const n = await prisma.pregunta.count({ where: { tipoExamen_id: tipo.id, generada: true } })
  console.log(`${tipo.nombre}: ${n} preguntas generadas.`)
  if (!n) return
  if (DRY) {
    console.log('--dry: no se borra nada.')
    return
  }
  // Ojo: Respuesta.pregunta es onDelete Cascade — al borrar se pierden las
  // respuestas de los estudiantes a esas preguntas. Por eso sólo se borran las
  // generadas, nunca las reales.
  const res = await prisma.pregunta.deleteMany({ where: { tipoExamen_id: tipo.id, generada: true } })
  console.log(`Borradas ${res.count}. La reserva vuelve a quedar disponible.`)
}

async function main() {
  if (REVERTIR >= 0) {
    await revertir((argv[REVERTIR + 1] || '').toUpperCase())
    return
  }

  const archivo = argv.find(a => !a.startsWith('--'))
  if (!archivo) {
    console.error('Uso: npx tsx scripts/importar-generadas.ts <lote.json> [--dry]')
    process.exit(1)
  }
  const ruta = path.resolve(archivo)
  if (!fs.existsSync(ruta)) {
    console.error(`No existe el archivo ${ruta}`)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(ruta, 'utf8'))
  const destino = await prisma.tipoExamen.findUnique({ where: { codigo: data.destino?.codigo } })
  if (!destino) {
    console.error(`El lote apunta al examen "${data.destino?.codigo}", que no existe.`)
    process.exit(1)
  }

  const opcionesEsperadas: number = data.perfil_estilo?.opciones_tipicas ?? 4
  const preguntas: any[] = data.preguntas || []
  console.log(`Lote: ${preguntas.length} preguntas para ${destino.nombre} (${destino.codigo})`)

  // Originales, para comprobar que de verdad se reformularon y no se copiaron.
  const origenIds = preguntas.map(p => p.origen_id).filter(Boolean)
  const originales = await prisma.pregunta.findMany({
    where: { id: { in: origenIds } },
    select: { id: true, enunciado: true, respuesta_correcta: true, opciones: true, anio: true, visible: true },
  })
  const porId = new Map(originales.map(o => [o.id, o]))

  const yaUsados = await prisma.pregunta.findMany({
    where: { origen_pregunta_id: { in: origenIds } },
    select: { origen_pregunta_id: true },
  })
  const usados = new Set(yaUsados.map(u => u.origen_pregunta_id))

  // Enunciados que ya existen en el examen destino, para no duplicar dentro de él.
  const existentes = await prisma.pregunta.findMany({
    where: { tipoExamen_id: destino.id },
    select: { enunciado: true },
  })
  const huellasDestino = new Set(existentes.map(e => huella(e.enunciado).slice(0, 80)))

  const validas: any[] = []
  const rechazos: Array<{ origen_id: string; motivo: string }> = []

  for (const p of preguntas) {
    const orig = porId.get(p.origen_id)
    if (!orig) {
      rechazos.push({ origen_id: p.origen_id, motivo: 'la pregunta origen no existe' })
      continue
    }
    if (orig.visible) {
      rechazos.push({ origen_id: p.origen_id, motivo: 'la pregunta origen está visible (no es reserva)' })
      continue
    }
    if (usados.has(p.origen_id)) {
      rechazos.push({ origen_id: p.origen_id, motivo: 'ese origen ya se usó antes' })
      continue
    }
    const ops: Opcion[] = Array.isArray(p.opciones) ? p.opciones : []
    if (ops.length !== opcionesEsperadas) {
      rechazos.push({ origen_id: p.origen_id, motivo: `tiene ${ops.length} opciones y el estilo pide ${opcionesEsperadas}` })
      continue
    }
    if (ops.some(o => !o?.letra || !o?.texto?.trim())) {
      rechazos.push({ origen_id: p.origen_id, motivo: 'hay opciones vacías o sin letra' })
      continue
    }
    if (!ops.some(o => o.letra === p.respuesta_correcta)) {
      rechazos.push({ origen_id: p.origen_id, motivo: `respuesta_correcta "${p.respuesta_correcta}" no está entre las opciones` })
      continue
    }
    if (new Set(ops.map(o => textoOpcion(o.texto))).size !== ops.length) {
      rechazos.push({ origen_id: p.origen_id, motivo: 'opciones repetidas entre sí' })
      continue
    }
    if (!p.enunciado?.trim() || huella(p.enunciado) === huella(orig.enunciado)) {
      rechazos.push({ origen_id: p.origen_id, motivo: 'el enunciado es idéntico al original (no se reformuló)' })
      continue
    }
    // La respuesta correcta tiene que seguir diciendo lo mismo. Se permite que la
    // reescriba o la complete ("5" -> "Queratina 5"), no que la sustituya por otra
    // cosa: eso significaría que la pregunta cambió de respuesta por el camino.
    const opsOrig: Opcion[] = Array.isArray(orig.opciones) ? (orig.opciones as Opcion[]) : []
    const correctaOrig = opsOrig.find(o => o.letra === orig.respuesta_correcta)?.texto ?? ''
    const correctaNueva = ops.find(o => o.letra === p.respuesta_correcta)!.texto
    const hO = huella(correctaOrig), hN = huella(correctaNueva)
    const contenida = hO.length > 0 && (hN.includes(hO) || hO.includes(hN))

    // "Todas las anteriores" / "A y B son correctas": al bajar el nº de opciones
    // hay que resolverlas, y eso cambia la pregunta de verdad. Siempre a mano.
    if (/(todas|ninguna|todos).*(correct|anterior)|^\s*(solo\s+)?[a-e]\s*(y|,)\s*[a-e]/i.test(correctaOrig)) {
      rechazos.push({
        origen_id: p.origen_id,
        motivo: `la respuesta original era agregada ("${correctaOrig.slice(0, 45)}") y hubo que resolverla — revisar a mano`,
      })
      continue
    }

    // Una sigla o abreviatura corta que se expande ("LES" -> "Lupus eritematoso
    // sistémico", "Ig A" -> "Inmunoglobulina A") es una mejora, no un cambio.
    const esAbreviatura = hO.length <= 16 || /^[A-ZÁÉÍÓÚ0-9\s.\-\/γβαλ]+$/.test(correctaOrig.trim())
    if (correctaOrig && !contenida && !esAbreviatura && parecido(correctaOrig, correctaNueva) < 0.35) {
      rechazos.push({
        origen_id: p.origen_id,
        motivo: `la respuesta correcta cambió de contenido ("${correctaOrig.slice(0, 40)}" -> "${correctaNueva.slice(0, 40)}")`,
      })
      continue
    }
    const faltan = tildesComidas(`${p.enunciado} ${ops.map(o => o.texto).join(' ')}`)
    if (faltan.length >= 2) {
      rechazos.push({ origen_id: p.origen_id, motivo: `faltan tildes (${faltan.slice(0, 4).join(', ')})` })
      continue
    }

    const h = huella(p.enunciado).slice(0, 80)
    if (huellasDestino.has(h)) {
      rechazos.push({ origen_id: p.origen_id, motivo: 'ya existe una pregunta casi igual en el examen destino' })
      continue
    }
    huellasDestino.add(h)

    validas.push({
      enunciado: p.enunciado.trim(),
      opciones: ops,
      respuesta_correcta: p.respuesta_correcta,
      especialidad: normalizeEspecialidad(p.especialidad || 'Medicina Interna'),
      tema: (p.tema || 'General').trim(),
      subtema: p.subtema?.trim() || null,
      dificultad: normDificultad(p.dificultad),
      anio: orig.anio,
      universidad: destino.nombre, // puente legacy: el simulacro por universidad filtra por este campo
      tipoExamen_id: destino.id,
      fuente: `Generada al estilo ${destino.nombre} (base: ${data.cantera?.nombre ?? 'reserva'} ${orig.anio})`,
      generada: true,
      visible: !OCULTO,
      origen_pregunta_id: p.origen_id,
    })
  }

  console.log(`Válidas: ${validas.length} · Rechazadas: ${rechazos.length}`)
  if (rechazos.length) {
    const porMotivo = new Map<string, number>()
    for (const r of rechazos) porMotivo.set(r.motivo, (porMotivo.get(r.motivo) || 0) + 1)
    for (const [motivo, n] of [...porMotivo.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  · ${n}× ${motivo}`)
    }
    const log = path.resolve(__dirname, 'data', 'lotes', `rechazos-${destino.codigo.toLowerCase()}.json`)
    fs.writeFileSync(log, JSON.stringify(rechazos, null, 2), 'utf8')
    console.log(`  detalle en ${log}`)
  }

  if (DRY) {
    console.log('\n--dry: no se inserta nada.')
    if (validas.length) {
      const m = validas[0]
      console.log(`\nEjemplo de lo que se insertaría:\n  ${m.enunciado}`)
      for (const o of m.opciones) console.log(`   ${o.letra}${o.letra === m.respuesta_correcta ? '*' : ' '}) ${o.texto}`)
    }
    return
  }

  if (!validas.length) {
    console.log('Nada que insertar.')
    return
  }

  const res = await prisma.pregunta.createMany({ data: validas, skipDuplicates: true })
  if (OCULTO) console.log('Insertadas EN RESERVA (visible=false): no se ven hasta liberarlas.')
  const total = await prisma.pregunta.count({ where: { tipoExamen_id: destino.id, visible: true } })
  console.log(`\nInsertadas ${res.count}. ${destino.nombre} pasa a ${total} preguntas visibles.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
