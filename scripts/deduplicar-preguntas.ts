/**
 * Deduplicación de preguntas. Dos trabajos independientes:
 *
 *   A) OPCIONES REPETIDAS dentro de una misma pregunta. El banco de origen
 *      (Moodle) ya traía la opción repetida — no lo introdujo la importación.
 *      Se colapsa a una sola, se reasignan las letras y se remapea
 *      respuesta_correcta POR TEXTO (nunca por letra).
 *
 *   B) ENUNCIADOS REPETIDOS entre preguntas distintas (mismo enunciado cargado
 *      desde dos bancos). Se conserva una y se borra la otra.
 *      Prioridad para conservar: más respuestas de usuarios > aparece en más
 *      sesiones > más antigua. Respuesta tiene onDelete: Cascade, así que
 *      borrar la copia con historial destruiría datos de usuarios.
 *      Si las dos copias marcan una respuesta correcta DISTINTA, no se toca
 *      ninguna: una de las dos está mal y eso necesita criterio médico.
 *
 * Uso:
 *   npx tsx scripts/deduplicar-preguntas.ts            # simulación
 *   npx tsx scripts/deduplicar-preguntas.ts --aplicar  # escribe
 *   ... --solo-opciones | --solo-enunciados
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import path from 'node:path'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const APLICAR = process.argv.includes('--aplicar')
const SOLO_OPC = process.argv.includes('--solo-opciones')
const SOLO_ENUN = process.argv.includes('--solo-enunciados')

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!),
} as never)

type Opcion = { letra: string; texto: string }
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

/** Laxa: para agrupar ENUNCIADOS iguales cargados desde bancos distintos. */
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * Estricta: para comparar OPCIONES entre sí. Solo ignora mayúsculas y espacios
 * sobrantes. NO toca acentos, letras griegas, superíndices ni puntuación:
 * "β1" y "β2", o "Peso/altura en m." y "Peso/(altura en m)²", son opciones
 * distintas y colapsarlas cambiaría la respuesta correcta por una incorrecta.
 */
const normOpcion = (s: string) => s.trim().replace(/\s+/g, ' ')

/**
 * Preguntas donde dos opciones difieren SOLO en mayúsculas y he verificado a
 * mano que son la misma opción repetida. No se hace por regla general porque
 * en genética las mayúsculas son semánticas: en "Madre F/f Padre F/F" los
 * alelos F y f son distintos y bajar a minúsculas fusionaría genotipos.
 */
const DUPLICADO_POR_MAYUSCULAS = new Set<string>([
  // A) "Aumento de la permeabilidad Epitelial Alveolar"
  // B) "Aumento de la Permeabilidad Epitelial Alveolar"  <- misma opción
  'cmrzxe1mf0124vwuag073m35e',
])

/**
 * Preguntas que NO se tocan aunque el detector las marque.
 * Aquí el texto de las opciones quedó destruido en el export original y
 * colapsar duplicados daría un resultado sin sentido: hay que rehacerlas a mano.
 */
/**
 * Conflictos revisados a mano donde las dos copias SÍ son la misma pregunta:
 * la respuesta correcta solo difiere por una errata. Clave = id a conservar,
 * valor = ids a borrar.
 */
const CONFLICTOS_RESUELTOS = new Map<string, string[]>([
  // "CUAL DE LOS SIGUIENTES MÚSCULOS CONSTITUYE EL ESFINTER ESOFÁGICO SUPERIOR"
  // Ambas responden el músculo cricofaríngeo; una lo escribe "cricofarigeo".
  ['cmq8s0cev00mba0v61bzfpsv5', ['cmq8rzsew00era0v6n6q7f7f9']],
])

const EXCLUIDAS = new Set<string>([
  // "LEYES DE CHARGAFF": el docx trae 8 opciones porque partió "G/C = 1",
  // "A/T = 1", etc. en dos líneas. Quedan varias opciones sueltas "1" y la
  // respuesta correcta del original es literalmente "1" — irreconstruible.
  'cmrzx95sj004jvwua9dtaxurc',
])

async function dedupOpciones() {
  console.log('\n===== A) OPCIONES REPETIDAS DENTRO DE UNA PREGUNTA =====\n')
  const preguntas = await prisma.pregunta.findMany({
    select: { id: true, enunciado: true, opciones: true, respuesta_correcta: true, fuente: true },
  })

  let arregladas = 0
  const pendientes: string[] = []

  for (const p of preguntas) {
    const ops = (p.opciones as unknown as Opcion[]) ?? []
    // Duplicado = mismo texto ignorando mayúsculas/acentos/puntuación.
    const clave = (t: string) =>
      DUPLICADO_POR_MAYUSCULAS.has(p.id) ? normOpcion(t).toLowerCase() : normOpcion(t)
    const vistos = new Map<string, Opcion>()
    const unicas: Opcion[] = []
    for (const o of ops) {
      const k = clave(o.texto)
      if (!k) continue
      if (vistos.has(k)) continue
      vistos.set(k, o)
      unicas.push(o)
    }
    if (unicas.length === ops.length) continue // sin duplicados

    if (EXCLUIDAS.has(p.id)) {
      pendientes.push(`[${p.id}] EXCLUIDA a propósito — texto destruido en origen, rehacer a mano\n      ${p.enunciado.slice(0, 90)}`)
      continue
    }

    const correctaTexto = ops.find(o => o.letra === p.respuesta_correcta)?.texto
    if (!correctaTexto) {
      pendientes.push(`[${p.id}] la respuesta_correcta (${p.respuesta_correcta}) no apunta a ninguna opción`)
      continue
    }
    if (unicas.length < 3) {
      pendientes.push(`[${p.id}] quedaría con ${unicas.length} opciones — muy pocas`)
      continue
    }

    // Reasignar letras y remapear la correcta POR TEXTO.
    const nuevas = unicas.map((o, i) => ({ letra: LETRAS[i], texto: o.texto }))
    const nuevaCorrecta = nuevas.find(o => clave(o.texto) === clave(correctaTexto))
    if (!nuevaCorrecta) {
      pendientes.push(`[${p.id}] no pude remapear la respuesta correcta tras deduplicar`)
      continue
    }

    console.log(`[${p.id}] ${p.enunciado.slice(0, 80).replace(/\s+/g, ' ')}`)
    console.log(`   antes: ${ops.map(o => o.letra + ') ' + o.texto).join(' | ').slice(0, 170)}  => ${p.respuesta_correcta}`)
    console.log(`   ahora: ${nuevas.map(o => o.letra + ') ' + o.texto).join(' | ').slice(0, 170)}  => ${nuevaCorrecta.letra}\n`)

    if (APLICAR) {
      await prisma.pregunta.update({
        where: { id: p.id },
        data: { opciones: nuevas as never, respuesta_correcta: nuevaCorrecta.letra },
      })
    }
    arregladas++
  }

  console.log(`opciones deduplicadas: ${arregladas}`)
  if (pendientes.length) {
    console.log(`\n-- sin tocar, requieren revisión (${pendientes.length}) --`)
    pendientes.forEach(s => console.log('   ' + s))
  }
}

async function dedupEnunciados() {
  console.log('\n===== B) ENUNCIADOS REPETIDOS ENTRE PREGUNTAS =====\n')
  const preguntas = await prisma.pregunta.findMany({
    select: {
      id: true, enunciado: true, opciones: true, respuesta_correcta: true,
      fuente: true, createdAt: true, _count: { select: { respuestas: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const sesiones = await prisma.sesion.findMany({ select: { preguntas_orden: true } })
  const usoEnSesiones = new Map<string, number>()
  for (const s of sesiones) {
    for (const id of s.preguntas_orden) usoEnSesiones.set(id, (usoEnSesiones.get(id) ?? 0) + 1)
  }

  const grupos = new Map<string, typeof preguntas>()
  for (const p of preguntas) {
    const k = norm(p.enunciado).slice(0, 140)
    if (k.length <= 60) continue
    grupos.set(k, [...(grupos.get(k) ?? []), p])
  }

  let borradas = 0
  const conflictos: string[] = []
  const aBorrar: string[] = []

  for (const [, copias] of grupos) {
    if (copias.length < 2) continue

    const textoCorrecta = (p: (typeof copias)[number]) => {
      const ops = (p.opciones as unknown as Opcion[]) ?? []
      return norm(ops.find(o => o.letra === p.respuesta_correcta)?.texto ?? '')
    }
    const claves = new Set(copias.map(textoCorrecta))
    // Si la respuesta correcta se normaliza a algo demasiado corto (símbolos,
    // números romanos sueltos) la comparación no es fiable: mejor conflicto.
    const fiable = [...claves].every(k => k.length >= 2)

    // ¿Conflicto ya resuelto a mano? Entonces se aplica esa decisión.
    const resuelto = copias.find(c => CONFLICTOS_RESUELTOS.has(c.id))
    if ((claves.size > 1 || !fiable) && resuelto) {
      const borrarIds = CONFLICTOS_RESUELTOS.get(resuelto.id)!
        .filter(id => copias.some(c => c.id === id))
      console.log(`"${resuelto.enunciado.slice(0, 85).replace(/\s+/g, ' ')}"  [conflicto resuelto a mano]`)
      console.log(`   conservo [${resuelto.id}] ${resuelto.fuente}`)
      borrarIds.forEach(id => console.log(`   borro    [${id}]`))
      aBorrar.push(...borrarIds)
      borradas += borrarIds.length
      continue
    }

    if (claves.size > 1 || !fiable) {
      conflictos.push(
        `${copias[0].enunciado.slice(0, 95).replace(/\s+/g, ' ')}\n` +
        copias.map(c => `        [${c.id}] ${c.fuente} -> "${textoCorrecta(c).slice(0, 60)}"`).join('\n')
      )
      continue
    }

    // Conservar: más respuestas de usuarios > más usada en sesiones > más antigua.
    const ordenadas = [...copias].sort((a, b) =>
      b._count.respuestas - a._count.respuestas ||
      (usoEnSesiones.get(b.id) ?? 0) - (usoEnSesiones.get(a.id) ?? 0) ||
      a.createdAt.getTime() - b.createdAt.getTime()
    )
    const conservar = ordenadas[0]
    const sobran = ordenadas.slice(1)

    console.log(`"${conservar.enunciado.slice(0, 85).replace(/\s+/g, ' ')}"`)
    console.log(`   conservo [${conservar.id}] ${conservar.fuente} (${conservar._count.respuestas} respuestas, ${usoEnSesiones.get(conservar.id) ?? 0} sesiones)`)
    for (const s of sobran) {
      console.log(`   borro    [${s.id}] ${s.fuente} (${s._count.respuestas} respuestas, ${usoEnSesiones.get(s.id) ?? 0} sesiones)`)
      aBorrar.push(s.id)
    }
    borradas += sobran.length
  }

  if (APLICAR && aBorrar.length) {
    // Sacar los ids de preguntas_orden para no dejar sesiones con huecos.
    await prisma.$executeRawUnsafe(
      `update "Sesion" set preguntas_orden = (
         select coalesce(array_agg(x), '{}') from unnest(preguntas_orden) x where x <> all($1::text[])
       ) where preguntas_orden && $1::text[]`,
      aBorrar
    )
    await prisma.pregunta.deleteMany({ where: { id: { in: aBorrar } } })
  }

  console.log(`\npreguntas duplicadas borradas: ${borradas}`)
  if (conflictos.length) {
    console.log(`\n-- CONFLICTO: mismo enunciado, respuesta correcta DISTINTA (${conflictos.length}) --`)
    console.log('   No se borra ninguna: una de las dos está mal y hay que decidir cuál.\n')
    conflictos.forEach(s => console.log('   ' + s + '\n'))
  }
}

async function main() {
  console.log(APLICAR ? '>> MODO ESCRITURA' : '>> SIMULACIÓN (usa --aplicar para escribir)')
  if (!SOLO_ENUN) await dedupOpciones()
  if (!SOLO_OPC) await dedupEnunciados()
  if (!APLICAR) console.log('\n(No se escribió nada.)')
  await prisma.$disconnect()
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
