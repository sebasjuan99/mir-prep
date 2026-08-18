/**
 * scripts/reserva.ts
 *
 * Gestiona qué preguntas se muestran en la plataforma y cuáles quedan guardadas.
 *
 * `Pregunta.visible = false` = en reserva: no entra en simulacros nuevos (ni por
 * universidad, ni por especialidad, ni aleatorios). Sí sigue apareciendo en el
 * repaso de errores de quien ya la contestó, y no se borra nada.
 *
 * Uso:
 *   npx tsx scripts/reserva.ts --estado
 *   npx tsx scripts/reserva.ts --liberar ELBOSQUE 500          # saca 500 de la reserva
 *   npx tsx scripts/reserva.ts --liberar-generadas             # publica todas las generadas
 *   npx tsx scripts/reserva.ts --guardar ENARM 1381            # manda 1381 a la reserva
 *   npx tsx scripts/reserva.ts --liberar ELBOSQUE 500 --dry
 *
 * Al liberar se eligen las más recientes y con mejor estructura primero.
 * Al guardar se mandan a reserva las más antiguas primero, y nunca las generadas.
 */
import path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!),
} as any)

const argv = process.argv.slice(2)
const DRY = argv.includes('--dry')

type Opcion = { letra: string; texto: string }

/** Estructura sana: 4+ opciones reales, respuesta existente, sin ruido de parseo. */
function esSana(p: { enunciado: string; opciones: unknown; respuesta_correcta: string }) {
  const ops = Array.isArray(p.opciones) ? (p.opciones as Opcion[]) : []
  if (ops.length < 4) return false
  if (!ops.some(o => o.letra === p.respuesta_correcta)) return false
  if (ops.some(o => !o?.texto?.trim())) return false
  if (/\*\*|~|\{|\}/.test(p.enunciado)) return false
  return p.enunciado.length >= 40 && p.enunciado.length <= 900
}

async function estado() {
  const tipos = await prisma.tipoExamen.findMany({ orderBy: { codigo: 'asc' } })
  console.log('EXAMEN'.padEnd(12) + 'VISIBLES'.padStart(9) + 'RESERVA'.padStart(9) + 'GENERADAS'.padStart(11))
  let tv = 0, tr = 0, tg = 0
  for (const t of tipos) {
    const [v, r, g] = await Promise.all([
      prisma.pregunta.count({ where: { tipoExamen_id: t.id, visible: true } }),
      prisma.pregunta.count({ where: { tipoExamen_id: t.id, visible: false } }),
      prisma.pregunta.count({ where: { tipoExamen_id: t.id, generada: true } }),
    ])
    tv += v; tr += r; tg += g
    console.log(t.codigo.padEnd(12) + String(v).padStart(9) + String(r).padStart(9) + String(g).padStart(11))
  }
  console.log('-'.repeat(41))
  console.log('TOTAL'.padEnd(12) + String(tv).padStart(9) + String(tr).padStart(9) + String(tg).padStart(11))
}

async function mover(codigo: string, cantidad: number, hacia: 'visible' | 'reserva') {
  const tipo = await prisma.tipoExamen.findUnique({ where: { codigo } })
  if (!tipo) {
    const todos = await prisma.tipoExamen.findMany({ select: { codigo: true } })
    console.error(`No existe "${codigo}". Disponibles: ${todos.map(t => t.codigo).join(', ')}`)
    process.exit(1)
  }

  const liberando = hacia === 'visible'
  const candidatas = await prisma.pregunta.findMany({
    where: {
      tipoExamen_id: tipo.id,
      visible: !liberando,
      // Las generadas no se mandan a la reserva: se crearon justamente para verse.
      ...(liberando ? {} : { generada: false }),
    },
    select: { id: true, enunciado: true, opciones: true, respuesta_correcta: true, anio: true },
    orderBy: liberando ? [{ anio: 'desc' }, { id: 'asc' }] : [{ anio: 'asc' }, { id: 'asc' }],
  })

  const orden = liberando
    ? [...candidatas.filter(esSana), ...candidatas.filter(p => !esSana(p))]
    : candidatas
  const elegidas = orden.slice(0, cantidad)

  if (elegidas.length < cantidad) {
    console.warn(`Sólo hay ${elegidas.length} disponibles (pedías ${cantidad}).`)
  }
  if (!elegidas.length) return

  const porAnio = new Map<number, number>()
  for (const p of elegidas) porAnio.set(p.anio, (porAnio.get(p.anio) || 0) + 1)
  console.log(
    `${tipo.nombre}: ${liberando ? 'liberando' : 'guardando'} ${elegidas.length} — ` +
      [...porAnio.entries()].sort((a, b) => b[0] - a[0]).map(([a, n]) => `${a}:${n}`).join(' · '),
  )

  if (DRY) {
    console.log('--dry: no se cambia nada.')
    return
  }

  const res = await prisma.pregunta.updateMany({
    where: { id: { in: elegidas.map(p => p.id) } },
    data: { visible: liberando },
  })
  const v = await prisma.pregunta.count({ where: { tipoExamen_id: tipo.id, visible: true } })
  console.log(`Actualizadas ${res.count}. ${tipo.nombre} queda con ${v} preguntas visibles.`)
}

/** Saca de la reserva TODAS las generadas. Se usa justo después de desplegar el
 *  código que muestra el chip "PREGUNTA GENERADA": antes de eso no deben verse. */
async function liberarGeneradas() {
  const pendientes = await prisma.pregunta.count({ where: { generada: true, visible: false } })
  console.log(`Generadas en reserva: ${pendientes}`)
  if (!pendientes) return
  if (DRY) { console.log('--dry: no se cambia nada.'); return }
  const res = await prisma.pregunta.updateMany({ where: { generada: true, visible: false }, data: { visible: true } })
  console.log(`Liberadas ${res.count}.`)
  await estado()
}

async function main() {
  if (argv.includes('--liberar-generadas')) return liberarGeneradas()
  const iLib = argv.indexOf('--liberar')
  const iGua = argv.indexOf('--guardar')

  if (argv.includes('--estado')) return estado()
  if (iLib >= 0) return mover((argv[iLib + 1] || '').toUpperCase(), parseInt(argv[iLib + 2] || '0', 10), 'visible')
  if (iGua >= 0) return mover((argv[iGua + 1] || '').toUpperCase(), parseInt(argv[iGua + 2] || '0', 10), 'reserva')

  console.error('Uso: --estado | --liberar <CODIGO> <N> | --guardar <CODIGO> <N> [--dry]')
  process.exit(1)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
