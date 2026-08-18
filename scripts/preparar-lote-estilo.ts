/**
 * scripts/preparar-lote-estilo.ts
 *
 * Paso 1 de 2 del pipeline "completar universidades".
 *
 * Toma preguntas de la RESERVA (visible = false, hoy el excedente de El Bosque),
 * de más reciente a más antigua, y las deja preparadas en un JSON junto con el
 * PERFIL DE ESTILO de la universidad destino, para que se reformulen imitando
 * ese estilo. No llama a ningún modelo: sólo selecciona y describe.
 *
 * El paso 2 es `scripts/importar-generadas.ts`, que inserta el resultado.
 *
 * Uso:
 *   npx tsx scripts/preparar-lote-estilo.ts SABANA 281
 *   npx tsx scripts/preparar-lote-estilo.ts CES 177 --fuente ELBOSQUE
 *   npx tsx scripts/preparar-lote-estilo.ts UPB 50 --dry     # sólo enseña el plan
 *
 * Reglas que garantiza:
 *   - Nunca escoge una pregunta de reserva ya usada como origen (índice único
 *     en Pregunta.origen_pregunta_id), así que ningún contenido se duplica
 *     entre universidades.
 *   - Nunca escoge una pregunta visible: la reserva es la única cantera.
 *   - Reparte por especialidad para que el examen destino quede equilibrado.
 */
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!),
} as any)

const argv = process.argv.slice(2)
const flag = (n: string) => argv.includes(`--${n}`)
const opt = (n: string, def?: string) => {
  const i = argv.indexOf(`--${n}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def
}

const DESTINO = (argv[0] || '').toUpperCase()
const CANTIDAD = parseInt(argv[1] || '0', 10)
const FUENTE = (opt('fuente', 'ELBOSQUE') as string).toUpperCase()
const DRY = flag('dry')
const DIR_LOTES = path.resolve(__dirname, 'data', 'lotes')

type Opcion = { letra: string; texto: string }

// ---------------------------------------------------------------------------
// Perfil de estilo del examen destino, medido sobre sus preguntas REALES
// (las generadas se excluyen: si no, cada lote imitaría al lote anterior y el
// estilo derivaría hasta dejar de parecerse a la universidad).
// ---------------------------------------------------------------------------

function mediana(xs: number[]) {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

function esCaso(enunciado: string, palabras: number) {
  return (
    /\b(paciente|masculino|femenina|mujer de|hombre de|a[ñn]os|lactante|reci[eé]n nacido|consulta por|acude)\b/i.test(
      enunciado,
    ) && palabras > 25
  )
}

async function perfilDeEstilo(tipoId: string, nombre: string) {
  const reales = await prisma.pregunta.findMany({
    where: { tipoExamen_id: tipoId, generada: false },
    select: { enunciado: true, opciones: true, dificultad: true, especialidad: true },
  })

  const palabras = reales.map(p => p.enunciado.split(/\s+/).length)
  const nOpciones = reales.map(p => (Array.isArray(p.opciones) ? (p.opciones as Opcion[]).length : 0))
  const casos = reales.filter(p => esCaso(p.enunciado, p.enunciado.split(/\s+/).length)).length
  const negativas = reales.filter(p =>
    /\b(EXCEPTO|FALSO|NO es|NO corresponde|incorrect|menos probable|NUNCA)\b/i.test(p.enunciado),
  ).length
  const vf = reales.filter(p => (Array.isArray(p.opciones) ? (p.opciones as Opcion[]).length : 0) === 2).length

  const distOpciones = new Map<number, number>()
  for (const n of nOpciones) distOpciones.set(n, (distOpciones.get(n) || 0) + 1)
  const opcionesTipicas = [...distOpciones.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 4

  const dif = new Map<string, number>()
  for (const p of reales) dif.set(p.dificultad, (dif.get(p.dificultad) || 0) + 1)

  const pct = (n: number) => (reales.length ? Math.round((n / reales.length) * 100) : 0)

  return {
    universidad: nombre,
    preguntas_reales_analizadas: reales.length,
    opciones_tipicas: opcionesTipicas,
    permite_verdadero_falso: pct(vf) >= 5,
    pct_verdadero_falso: pct(vf),
    palabras_enunciado: {
      min: Math.min(...palabras),
      mediana: mediana(palabras),
      max: Math.max(...palabras),
    },
    pct_caso_clinico: pct(casos),
    pct_fraseo_negativo: pct(negativas),
    dificultad: Object.fromEntries([...dif.entries()].map(([k, v]) => [k, pct(v)])),
    // Muestra literal para que quien reformule vea el tono, no sólo los números.
    ejemplos: reales.slice(0, 12).map(p => ({
      enunciado: p.enunciado,
      opciones: p.opciones as Opcion[],
    })),
  }
}

// ---------------------------------------------------------------------------

async function main() {
  if (!DESTINO || !CANTIDAD) {
    console.error('Uso: npx tsx scripts/preparar-lote-estilo.ts <CODIGO_DESTINO> <CANTIDAD> [--fuente CODIGO] [--dry]')
    process.exit(1)
  }

  const destino = await prisma.tipoExamen.findUnique({ where: { codigo: DESTINO } })
  const fuente = await prisma.tipoExamen.findUnique({ where: { codigo: FUENTE } })
  if (!destino) {
    const todos = await prisma.tipoExamen.findMany({ select: { codigo: true } })
    console.error(`No existe el examen destino "${DESTINO}". Disponibles: ${todos.map(t => t.codigo).join(', ')}`)
    process.exit(1)
  }
  if (!fuente) {
    console.error(`No existe el examen fuente "${FUENTE}".`)
    process.exit(1)
  }

  const yaTiene = await prisma.pregunta.count({ where: { tipoExamen_id: destino.id, visible: true } })
  const disponibles = await prisma.pregunta.count({
    where: { tipoExamen_id: fuente.id, visible: false, origen_pregunta_id: null },
  })

  console.log(`Destino: ${destino.nombre} (${DESTINO}) — ${yaTiene} preguntas visibles hoy`)
  console.log(`Cantera: ${fuente.nombre} (${FUENTE}) — ${disponibles} en reserva sin usar`)

  // Los orígenes ya comprometidos en OTROS lotes preparados todavía sin importar:
  // en la base siguen libres (origen_pregunta_id se ocupa al insertar), así que si
  // no los descontamos aquí, dos universidades acabarían reformulando lo mismo.
  const reservados = new Set<string>()
  if (fs.existsSync(DIR_LOTES)) {
    for (const f of fs.readdirSync(DIR_LOTES).filter(f => f.endsWith('.json') && !f.startsWith('rechazos-'))) {
      try {
        const lote = JSON.parse(fs.readFileSync(path.join(DIR_LOTES, f), 'utf8'))
        for (const p of lote.preguntas ?? []) if (p.origen_id) reservados.add(p.origen_id)
      } catch {
        console.warn(`  (no pude leer ${f}, lo ignoro)`)
      }
    }
  }
  if (reservados.size) console.log(`Comprometidas en lotes ya preparados: ${reservados.size}`)

  if (disponibles - reservados.size < CANTIDAD) {
    console.error(`\nNo alcanza: pides ${CANTIDAD} y sólo quedan ${disponibles - reservados.size} libres.`)
    process.exit(1)
  }

  const perfil = await perfilDeEstilo(destino.id, destino.nombre)
  if (perfil.preguntas_reales_analizadas < 15) {
    console.warn(
      `\n⚠  Sólo hay ${perfil.preguntas_reales_analizadas} preguntas reales de ${destino.nombre}. ` +
        `El perfil de estilo será poco específico; las generadas saldrán más genéricas.`,
    )
  }

  // Candidatas: reserva sin usar, priorizando lo más reciente y con estructura sana.
  const candidatas = await prisma.pregunta.findMany({
    where: {
      tipoExamen_id: fuente.id,
      visible: false,
      origen_pregunta_id: null,
    },
    select: {
      id: true,
      enunciado: true,
      opciones: true,
      respuesta_correcta: true,
      especialidad: true,
      tema: true,
      subtema: true,
      dificultad: true,
      anio: true,
      fuente: true,
    },
    orderBy: [{ anio: 'desc' }, { id: 'asc' }],
  })

  const sanas = candidatas.filter(p => {
    if (reservados.has(p.id)) return false
    const ops = Array.isArray(p.opciones) ? (p.opciones as Opcion[]) : []
    if (ops.length < 4) return false
    if (!ops.some(o => o.letra === p.respuesta_correcta)) return false
    if (ops.some(o => !o.texto || !o.texto.trim())) return false
    if (/\*\*|~|\{|\}/.test(p.enunciado)) return false
    const largo = p.enunciado.length
    return largo >= 40 && largo <= 900
  })

  // Reparto por especialidad: round-robin, para no llenar el examen de una sola.
  const porEspecialidad = new Map<string, typeof sanas>()
  for (const p of sanas) {
    const k = p.especialidad
    if (!porEspecialidad.has(k)) porEspecialidad.set(k, [])
    porEspecialidad.get(k)!.push(p)
  }
  const colas = [...porEspecialidad.values()]
  const elegidas: typeof sanas = []
  let vuelta = 0
  while (elegidas.length < CANTIDAD) {
    let metidas = 0
    for (const cola of colas) {
      if (elegidas.length >= CANTIDAD) break
      if (cola[vuelta]) {
        elegidas.push(cola[vuelta])
        metidas++
      }
    }
    if (!metidas) break
    vuelta++
  }

  if (elegidas.length < CANTIDAD) {
    console.error(`\nSólo ${elegidas.length} candidatas pasan el filtro de calidad (pedías ${CANTIDAD}).`)
    process.exit(1)
  }

  const repartoEsp = new Map<string, number>()
  for (const p of elegidas) repartoEsp.set(p.especialidad, (repartoEsp.get(p.especialidad) || 0) + 1)

  console.log(`\nEstilo de ${destino.nombre}: ${perfil.opciones_tipicas} opciones · ` +
    `mediana ${perfil.palabras_enunciado.mediana} palabras · ` +
    `${perfil.pct_caso_clinico}% caso clínico · ${perfil.pct_fraseo_negativo}% fraseo negativo`)
  console.log(`Seleccionadas ${elegidas.length} de la reserva, en ${repartoEsp.size} especialidades ` +
    `(máx ${Math.max(...repartoEsp.values())} por especialidad).`)

  if (DRY) {
    console.log('\n--dry: no se escribe nada.')
    return
  }

  fs.mkdirSync(DIR_LOTES, { recursive: true })
  const salida = path.join(DIR_LOTES, `${DESTINO.toLowerCase()}-lote-${elegidas.length}.json`)
  fs.writeFileSync(
    salida,
    JSON.stringify(
      {
        destino: { codigo: DESTINO, nombre: destino.nombre },
        cantera: { codigo: FUENTE, nombre: fuente.nombre },
        perfil_estilo: perfil,
        instrucciones:
          'Reformula cada pregunta al estilo del destino: mismo hecho médico evaluado y misma ' +
          'respuesta correcta, pero enunciado reescrito, opciones reordenadas y redactadas con el ' +
          'fraseo y la longitud del perfil. Devuelve el mismo origen_id para poder trazarla.',
        preguntas: elegidas.map(p => ({
          origen_id: p.id,
          enunciado: p.enunciado,
          opciones: p.opciones,
          respuesta_correcta: p.respuesta_correcta,
          especialidad: p.especialidad,
          tema: p.tema,
          subtema: p.subtema,
          dificultad: p.dificultad,
        })),
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(`\nLote escrito en: ${salida}`)
  console.log(`Siguiente paso: reformular y luego  npx tsx scripts/importar-generadas.ts ${salida}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
