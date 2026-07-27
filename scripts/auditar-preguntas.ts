/**
 * Auditoría de calidad de enunciados/opciones.
 *
 * Detecta preguntas cuyo texto quedó dañado en la fuente (exportes de Moodle a
 * Word donde las secuencias "a." … "e." se comieron o se volvieron "~") además
 * de problemas estructurales básicos.
 *
 * Uso:  npx tsx scripts/auditar-preguntas.ts [--json salida.json]
 * Solo lee. No modifica nada.
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  console.error('\n✗ Falta DATABASE_URL (o DIRECT_URL) en .env.local\n')
  process.exit(1)
}
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) } as never)

type Opcion = { letra: string; texto: string }

/**
 * Normaliza para comparar. Conserva letras griegas y romanas: en este banco
 * muchas opciones se distinguen solo por α/β/δ o I/II/III y borrarlas produce
 * falsos duplicados.
 */
const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñͰ-Ͽ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const palabras = (s: string) => normalizar(s).split(' ').filter(w => w.length > 3)

async function main() {
  const preguntas = await prisma.pregunta.findMany({
    select: {
      id: true, enunciado: true, opciones: true, respuesta_correcta: true,
      especialidad: true, tema: true, fuente: true, universidad: true, imagen_url: true,
    },
  })
  console.log(`Analizando ${preguntas.length} preguntas...\n`)

  // Vocabulario del corpus completo: una palabra "real" aparece muchas veces.
  const vocab = new Map<string, number>()
  for (const p of preguntas) {
    const ops = (p.opciones as unknown as Opcion[]) ?? []
    for (const w of palabras(p.enunciado + ' ' + ops.map(o => o.texto).join(' '))) {
      vocab.set(w, (vocab.get(w) ?? 0) + 1)
    }
  }

  /** Última palabra truncada: no existe en el corpus, pero sí existe al devolverle una letra a-e. */
  const truncada = (texto: string): string | null => {
    const t = texto.trim()
    if (/[.?:!)\]]$/.test(t)) return null // termina en puntuación -> completa
    const ws = normalizar(t).split(' ')
    const last = ws[ws.length - 1]
    if (!last || last.length < 4) return null
    if ((vocab.get(last) ?? 0) > 2) return null // palabra común -> no truncada
    for (const letra of ['a', 'b', 'c', 'd', 'e']) {
      const cand = last + letra
      if ((vocab.get(cand) ?? 0) >= 3) return `${last} → ${cand}`
    }
    return null
  }

  const hallazgos: Record<string, typeof preguntas> = {}
  const add = (k: string, p: (typeof preguntas)[number]) => {
    ;(hallazgos[k] ??= [] as never)?.push(p as never)
  }

  const vistos = new Map<string, string>()

  for (const p of preguntas) {
    const ops = (p.opciones as unknown as Opcion[]) ?? []
    const enun = p.enunciado ?? ''

    // 1. Marcadores GIFT/Moodle filtrados dentro del texto
    if (/[~{}]|####/.test(enun) || /^\s*=/.test(enun)) add('marcadores_gift_en_enunciado', p)
    if (ops.some(o => /[~{}]|####/.test(o.texto))) add('marcadores_gift_en_opciones', p)

    // 2. Truncamiento por "letra + punto" comida
    if (truncada(enun)) add('enunciado_truncado', p)
    if (ops.some(o => truncada(o.texto))) add('opcion_truncada', p)

    // 2b. Puntuación final inconsistente: si la mayoría de opciones cierran con
    // punto y una o dos no, esas suelen ser las que perdieron "…a." al final.
    const conPunto = ops.filter(o => /\.\s*$/.test(o.texto)).length
    if (ops.length >= 4 && conPunto >= ops.length - 2 && conPunto < ops.length) {
      add('puntuacion_final_inconsistente', p)
    }

    // 3. Enunciado que no formula pregunta (y no se apoya en imagen)
    const sinPregunta =
      !/[?:]/.test(enun) &&
      !/(cu[aá]l|qu[eé]|c[oó]mo|cu[aá]nd|d[oó]nde|indique|se[ñn]ale|elija|seleccione|excepto|verdader|falso|siguiente)/i.test(enun)
    if (enun.trim().length < 40 && !p.imagen_url) add('enunciado_muy_corto', p)
    else if (sinPregunta && !p.imagen_url) add('enunciado_sin_formular_pregunta', p)

    // 4. Estructura de opciones
    if (ops.length < 3) add('menos_de_3_opciones', p)
    if (ops.some(o => !o.texto || !o.texto.trim())) add('opcion_vacia', p)
    if (!ops.some(o => o.letra === p.respuesta_correcta)) add('respuesta_correcta_inexistente', p)
    // Comparación estricta: solo espacios sobrantes. Colapsar acentos o
    // símbolos daría "β1"=="β2"; bajar a minúsculas fusionaría los alelos
    // "F"/"f" de las preguntas de genética. Ambos serían falsos duplicados.
    const textosNorm = ops.map(o => o.texto.trim().replace(/\s+/g, ' '))
    if (new Set(textosNorm).size !== textosNorm.length) add('opciones_duplicadas', p)

    // 5. Duplicados entre preguntas
    const clave = normalizar(enun).slice(0, 140)
    if (clave.length > 60) {
      if (vistos.has(clave)) add('enunciado_duplicado', p)
      else vistos.set(clave, p.id)
    }
  }

  const orden = Object.entries(hallazgos).sort((a, b) => b[1].length - a[1].length)
  for (const [k, lista] of orden) {
    console.log(`\n### ${k}: ${lista.length}`)
    const porFuente = new Map<string, number>()
    for (const p of lista) porFuente.set(p.fuente ?? '(sin fuente)', (porFuente.get(p.fuente ?? '(sin fuente)') ?? 0) + 1)
    console.log(
      '  fuentes: ' +
        [...porFuente.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f, n]) => `${f} (${n})`).join(', ')
    )
    for (const p of lista.slice(0, 5)) {
      console.log(`  - [${p.id}] ${p.enunciado.slice(0, 120).replace(/\s+/g, ' ')}`)
    }
  }

  const argJson = process.argv.indexOf('--json')
  if (argJson > -1 && process.argv[argJson + 1]) {
    const salida = orden.map(([tipo, lista]) => ({
      tipo,
      total: lista.length,
      preguntas: lista.map(p => ({
        id: p.id, fuente: p.fuente, especialidad: p.especialidad, tema: p.tema,
        enunciado: p.enunciado, opciones: p.opciones, respuesta_correcta: p.respuesta_correcta,
      })),
    }))
    fs.writeFileSync(process.argv[argJson + 1], JSON.stringify(salida, null, 2), 'utf8')
    console.log(`\nDetalle escrito en ${process.argv[argJson + 1]}`)
  }

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
