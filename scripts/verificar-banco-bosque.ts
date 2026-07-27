/**
 * Cruza el banco "El Bosque (Moodle)" de la base contra el .docx exportado de
 * Moodle, que trae la línea "La respuesta correcta es: …".
 *
 * Sirve para detectar dos daños del export a Word:
 *   1. "Ca. de Próstata" partido en dos opciones ("C." + "de Próstata"), que
 *      desplaza las letras y deja la respuesta_correcta apuntando a otra cosa.
 *   2. Texto truncado / marcadores GIFT filtrados en el enunciado.
 *
 * Uso:  npx tsx scripts/verificar-banco-bosque.ts [--json salida.json]
 * Solo lee. No modifica nada.
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import mammoth from 'mammoth'
import fs from 'node:fs'
import path from 'node:path'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const DIR_BOSQUE = path.resolve(
  __dirname, '..',
  'RECONSTRUCCIONES-20260709T164408Z-2-001', 'RECONSTRUCCIONES', 'Bosque'
)

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) } as never)

type Opcion = { letra: string; texto: string }
type Original = { enunciado: string; opciones: string[]; correcta: string }

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim()

/** Parsea el export de Moodle: bloques "Enunciado de la pregunta" → opciones → respuesta. */
function parsearDocx(texto: string): Original[] {
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean)
  const out: Original[] = []
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i] !== 'Enunciado de la pregunta') continue
    let j = i + 1
    const enunLineas: string[] = []
    while (j < lineas.length && lineas[j] !== 'Seleccione una:' && lineas[j] !== 'Enunciado de la pregunta') {
      enunLineas.push(lineas[j]); j++
    }
    if (lineas[j] !== 'Seleccione una:') continue
    j++
    const opciones: string[] = []
    while (j < lineas.length && /^[a-z]\.\s*/.test(lineas[j])) {
      opciones.push(lineas[j].replace(/^[a-z]\.\s*/, '')); j++
    }
    // la respuesta puede venir tras un bloque de retroalimentación libre
    let correcta = ''
    for (let k = j; k < Math.min(j + 12, lineas.length); k++) {
      const m = lineas[k].match(/^La respuesta correcta es:\s*(.+)$/)
      if (m) { correcta = m[1].trim(); break }
      if (lineas[k] === 'Enunciado de la pregunta') break
    }
    if (opciones.length && correcta) {
      out.push({ enunciado: enunLineas.join(' '), opciones, correcta })
    }
  }
  return out
}

async function main() {
  const docxs = fs.readdirSync(DIR_BOSQUE).filter(f => f.toLowerCase().endsWith('.docx'))
  const originales: Original[] = []
  for (const f of docxs) {
    const raw = (await mammoth.extractRawText({ path: path.join(DIR_BOSQUE, f) })).value
    const parsed = parsearDocx(raw)
    console.log(`  ${f}: ${parsed.length}`)
    originales.push(...parsed)
  }
  console.log(`Preguntas parseadas de los docx: ${originales.length}`)

  // Indexa por enunciado normalizado. El enunciado en base puede ser el bloque
  // GIFT pegado, así que también indexamos por el conjunto de opciones.
  const porEnunciado = new Map<string, Original>()
  const porOpciones = new Map<string, Original>()
  for (const o of originales) {
    porEnunciado.set(norm(o.enunciado).slice(0, 120), o)
    porOpciones.set(o.opciones.map(norm).sort().join('¶'), o)
  }

  const preguntas = await prisma.pregunta.findMany({
    where: { fuente: 'Banco El Bosque (Moodle)' },
    select: { id: true, enunciado: true, opciones: true, respuesta_correcta: true, especialidad: true, tema: true },
  })
  console.log(`Preguntas en base (Banco El Bosque (Moodle)): ${preguntas.length}\n`)

  const problemas: Record<string, unknown[]> = {}
  const add = (k: string, v: unknown) => { (problemas[k] ??= []).push(v) }
  let emparejadas = 0

  for (const p of preguntas) {
    const ops = (p.opciones as unknown as Opcion[]) ?? []
    const clave = norm(p.enunciado).slice(0, 120)
    const orig =
      porEnunciado.get(clave) ??
      porOpciones.get(ops.map(o => norm(o.texto)).sort().join('¶'))
    if (!orig) { add('sin_original', { id: p.id, enunciado: p.enunciado.slice(0, 90) }); continue }
    emparejadas++

    const elegida = ops.find(o => o.letra === p.respuesta_correcta)
    const okRespuesta = elegida && norm(elegida.texto) === norm(orig.correcta)
    if (!okRespuesta) {
      add('respuesta_no_coincide', {
        id: p.id, especialidad: p.especialidad, tema: p.tema,
        enunciado: p.enunciado.slice(0, 140),
        en_base: `${p.respuesta_correcta}) ${elegida?.texto ?? '(letra inexistente)'}`,
        en_original: orig.correcta,
        opciones_base: ops.map(o => `${o.letra}) ${o.texto}`),
        opciones_original: orig.opciones,
      })
    }
    if (orig.opciones.length !== ops.length) {
      add('numero_de_opciones_distinto', {
        id: p.id, base: ops.length, original: orig.opciones.length,
        enunciado: p.enunciado.slice(0, 100),
        opciones_original: orig.opciones,
      })
    }
    if (norm(orig.enunciado).slice(0, 120) !== clave) {
      add('enunciado_no_coincide', {
        id: p.id, en_base: p.enunciado.slice(0, 160), en_original: orig.enunciado.slice(0, 200),
      })
    }
  }

  console.log(`Emparejadas con el original: ${emparejadas}/${preguntas.length}\n`)
  for (const [k, v] of Object.entries(problemas).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`### ${k}: ${v.length}`)
  }

  const argJson = process.argv.indexOf('--json')
  if (argJson > -1 && process.argv[argJson + 1]) {
    fs.writeFileSync(process.argv[argJson + 1], JSON.stringify(problemas, null, 2), 'utf8')
    console.log(`\nDetalle en ${process.argv[argJson + 1]}`)
  }
  await prisma.$disconnect()
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
