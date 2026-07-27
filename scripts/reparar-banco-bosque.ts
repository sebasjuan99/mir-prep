/**
 * Repara el banco "El Bosque (Moodle)".
 *
 * El .docx exportado de Moodle rompió el texto en dos formas:
 *   A) Las secuencias "a." … "e." dentro de una frase se interpretaron como
 *      inicio de opción: se comieron la letra y el punto (dejando "~" o
 *      truncando la palabra) y, cuando partieron una opción en dos, corrieron
 *      las letras y dejaron la respuesta correcta apuntando a otro texto.
 *   B) En algunas preguntas quedó pegado un bloque GIFT de OTRA pregunta
 *      ({ =correcta ~distractor }) y el importador lo tomó como enunciado.
 *
 * Dos mecanismos:
 *   1. AUTOMÁTICO — cruza contra los .docx (que conservan "La respuesta
 *      correcta es: …") y corrige respuesta_correcta cuando ese texto coincide
 *      exactamente con una y solo una opción de la base.
 *   2. MANUAL — tabla de reconstrucciones de texto revisadas una a una. Cada
 *      entrada busca un fragmento literal; si no aparece tal cual, se salta y
 *      se avisa (nunca escribe a ciegas).
 *
 * Uso:
 *   npx tsx scripts/reparar-banco-bosque.ts            # simulación, no escribe
 *   npx tsx scripts/reparar-banco-bosque.ts --aplicar  # escribe en la base
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import mammoth from 'mammoth'
import path from 'node:path'
import fs from 'node:fs'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const DIR_BOSQUE = path.resolve(
  __dirname, '..',
  'RECONSTRUCCIONES-20260709T164408Z-2-001', 'RECONSTRUCCIONES', 'Bosque'
)
const APLICAR = process.argv.includes('--aplicar')

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!),
} as never)

type Opcion = { letra: string; texto: string }

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim()

/** Jaccard sobre palabras: 1 = idénticas, 0 = sin nada en común. */
function similitud(a: string, b: string): number {
  const A = new Set(a.split(' ').filter(Boolean))
  const B = new Set(b.split(' ').filter(Boolean))
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / (A.size + B.size - inter)
}

// ---------------------------------------------------------------------------
// 1. Reconstrucciones de texto revisadas una a una.
//    "buscar" es un fragmento literal del texto actual; si no aparece exacto,
//    la entrada se salta. Solo se repone lo que el export se comió.
// ---------------------------------------------------------------------------
type FixTexto = { id: string; buscar: string; poner: string; nota: string }

const ENUNCIADOS: FixTexto[] = [
  // --- B) enunciado real recuperado del docx (había quedado el bloque GIFT) ---
  {
    id: 'cmrzxbmgo00lgvwuafvkhznin',
    buscar: '=Síndrome Coronario Agudo** ~Insuficiencia Cardiaca }',
    poner: 'SON CAUSAS DE INSUFICIENCIA CARDIACA CON GASTO CARDIACO ELEVADO, EXCEPTO:',
    nota: 'enunciado real recuperado del docx (Pregunta 110); las 5 opciones y la respuesta ya coincidían',
  },
  {
    id: 'cmrzxds65010bvwuao3e4dri3',
    buscar: '~Disminuir la permeabilidad al potasio =Aumentar la permeabilidad al cloruro }',
    poner:
      'UNA PERSONA NO PUEDE EN EL LADO DERECHO DE LA CARA CERRAR EL OJO, ARRUGAR LA NARIZ O ' +
      'CONTRAER LA COMISURA LABIAL. EL PAR CRANEANO COMPROMETIDO ES:',
    nota: 'enunciado real recuperado del docx (Pregunta 161); opciones X/IX/VII/V y respuesta VII coinciden',
  },
  {
    id: 'cmrzx9zvu00a9vwualdykw2xz',
    buscar: '~Somatostatina ####',
    poner: 'EL HÍGADO NO PUEDE UTILIZAR CUERPOS CETÓNICOS PARA GENERAR ENERGÍA, DEBIDO A LA AUSENCIA DE LA ENZIMA:',
    nota: 'enunciado real recuperado del docx (Pregunta 36); se corrige el typo "UTILIAR"',
  },
  {
    // cola del bloque GIFT: la retroalimentación de la OTRA pregunta.
    id: 'cmrzx9zvu00a9vwualdykw2xz',
    buscar:
      ' La Insulina dentro de su mecanismo de acción incluye a catbohídratos y lípidos. Una de las funciones ' +
      'sobre El metabolismo lipídico es La activación de La Lipoproteinlipasa extrahepática. Las demás ' +
      'sustancias se oponen al mecanismo de acción de La insulina }',
    poner: '',
    nota: 'explicación de otra pregunta que arrastró el export',
  },

  // --- A) "~" = letra + punto que el export se comió ---
  { id: 'cmrzxdsbc010cvwuahonuwogd', buscar: 'DE LA CAR~EL', poner: 'DE LA CARA. EL', nota: '~ = "A."' },
  { id: 'cmrzx9ev4006avwua4x1ntsum', buscar: 'DE DN~ SEÑALE', poner: 'DE DNA. SEÑALE', nota: '~ = "A."' },
  { id: 'cmrzx98ny0053vwuairxlgwwb', buscar: 'EN EL DN~TENIENDO', poner: 'EN EL DNA. TENIENDO', nota: '~ = "A."' },
  { id: 'cmrzxd9ol00wsvwuahqugaca2', buscar: 'HACIA AFUER~USTED', poner: 'HACIA AFUERA. USTED', nota: '~ = "A."' },
  { id: 'cmrzxa6pt00bkvwuavn9psj6o', buscar: 'RESISTENCIA LA INSULIN~SEÑALE', poner: 'RESISTENCIA A LA INSULINA. SEÑALE', nota: '~ = "A."; se repone la preposición' },
  { id: 'cmrzxev6c017svwua54lt8cj9', buscar: 'AÓRTICA LEV~SEÑALE', poner: 'AÓRTICA LEVE. SEÑALE', nota: '~ = "E."' },
  { id: 'cmrzxdcur00xevwuahlbxdsr7', buscar: 'DE LA HEMORRAGI~LA LOCALIZACIÓN DEL A HEMORRAGIA', poner: 'DE LA HEMORRAGIA. LA LOCALIZACIÓN DE LA HEMORRAGIA', nota: '~ = "A."' },
  { id: 'cmrzxg0vj01ftvwuan646elqr', buscar: 'Y SOMNOLENCI~COMO ANTECEDENTE IMPORTATENTE', poner: 'Y SOMNOLENCIA. COMO ANTECEDENTE IMPORTANTE', nota: '~ = "A."' },
  { id: 'cmrzxf9qz01alvwua0b0is95a', buscar: 'posible falla cardíac~En el hospital', poner: 'posible falla cardíaca. En el hospital', nota: '~ = "a."' },
  { id: 'cmrzxdq0000zwvwuafnixpqjf', buscar: 'HEMORRAGIA ANTIGU~CON EL', poner: 'HEMORRAGIA ANTIGUA. CON EL', nota: '~ = "A."' },
  { id: 'cmrzxf8lf01advwualyqgp9fr', buscar: 'el olor que percib~En otros', poner: 'el olor que percibe. En otros', nota: '~ = "e."' },
  { id: 'cmrzxdouf00zovwuaqi4rglpb', buscar: 'CON MEJORÍ~EL ÚNICO', poner: 'CON MEJORÍA. EL ÚNICO', nota: '~ = "A."' },
  { id: 'cmrzxdouf00zovwuaqi4rglpb', buscar: 'ROTULIANA Y AQUILIAN~CON LA HISTORÍA', poner: 'ROTULIANA Y AQUILIANA. CON LA HISTORIA', nota: '~ = "A."' },
  { id: 'cmrzxdq5800zxvwualh9iywtf', buscar: 'RECUPERÓ TRANSITIRIAMENT~POSTERIORMENTE', poner: 'RECUPERÓ TRANSITORIAMENTE. POSTERIORMENTE', nota: '~ = "E."' },
  { id: 'cmrzxdq5800zxvwualh9iywtf', buscar: 'AHORA NO RESPOND~EL EXÁMEN', poner: 'AHORA NO RESPONDE. EL EXAMEN', nota: '~ = "E."' },
  { id: 'cmrzxdozn00zpvwuaj32yi0gp', buscar: 'CON FRECUENCI~POSTERIORMENTE, APARECIERÓN', poner: 'CON FRECUENCIA. POSTERIORMENTE, APARECIERON', nota: '~ = "A."' },
  { id: 'cmrzxdozn00zpvwuaj32yi0gp', buscar: 'LLEVARON A LA MUERT~LA ANATOMÍA', poner: 'LLEVARON A LA MUERTE. LA ANATOMÍA', nota: '~ = "E."' },
  { id: 'cmrzxco6p00sovwuaoqi9hf5p', buscar: 'LLEGO DESPUÉSDE', poner: 'LLEGÓ DESPUÉS DE', nota: 'palabras pegadas en el export' },
  { id: 'cmrzxco6p00sovwuaoqi9hf5p', buscar: 'SOBRESALE SU EMPUÑAD~LOSRAYOS X', poner: 'SOBRESALE SU EMPUÑADURA. LOS RAYOS X', nota: '~ = "A."; "empuñadura" por contexto' },
  { id: 'cmrzxco6p00sovwuaoqi9hf5p', buscar: 'SACRO ILIACA DERECH~DE LO', poner: 'SACRO ILIACA DERECHA. DE LO', nota: '~ = "A."' },
  {
    id: 'cmrzxc82900plvwuaehq3ky76',
    buscar: 'EL ~A COLORECTAL HEREDITARIO SIN POLIPOS',
    poner: 'EL CÁNCER COLORRECTAL HEREDITARIO SIN PÓLIPOS',
    nota: '"C.A" (carcinoma) partido por el export; se escribe completo — es el síndrome de Lynch',
  },
]

const OPCIONES: (FixTexto & { letra: string })[] = [
  { id: 'cmrzxev6c017svwua54lt8cj9', letra: 'A', buscar: 'endocarditis bacterian', poner: 'endocarditis bacteriana.', nota: 'se comió "a."' },
  { id: 'cmrzxev6c017svwua54lt8cj9', letra: 'B', buscar: 'angiografía y valvuloplasti', poner: 'angiografía y valvuloplastia.', nota: 'se comió "a."' },
  { id: 'cmrzxev6c017svwua54lt8cj9', letra: 'C', buscar: 'ventricular izquierda sever', poner: 'ventricular izquierda severa.', nota: 'se comió "a."' },
  { id: 'cmrzxcoh200sqvwuarpxzt1q3', letra: 'D', buscar: 'de sodio disminuirí', poner: 'de sodio disminuiría.', nota: 'se comió "a."' },
  { id: 'cmrzxcpca00swvwuatcvrg1he', letra: 'A', buscar: 'en presencia de est', poner: 'en presencia de esta.', nota: 'se comió "a."' },
  { id: 'cmrzxcpca00swvwuatcvrg1he', letra: 'D', buscar: 'de sodio y glucos', poner: 'de sodio y glucosa.', nota: 'se comió "a."' },
  { id: 'cmrzxerpw0174vwua26bqjvrp', letra: 'A', buscar: 'para ver si aument', poner: 'para ver si aumenta.', nota: 'se comió "a."' },
  { id: 'cmrzxerpw0174vwua26bqjvrp', letra: 'C', buscar: 'Está indicada siempre en la CI', poner: 'Está indicada siempre en la CIA.', nota: 'se comió "a."' },
  { id: 'cmrzxeuw0017qvwuasjxttz40', letra: 'D', buscar: 'Coartación de aort', poner: 'Coartación de aorta.', nota: 'se comió "a."' },
]

/**
 * En el GIFT de origen "**" marcaba la opción correcta y quedó pegado al texto:
 * era una pista visible que regalaba la respuesta. Se quita en todo el banco.
 */
function limpiarAsteriscos(texto: string): string {
  return texto.replace(/\s*\*\*+\s*$/, '').trimEnd()
}

/**
 * Preguntas cuyo juego de opciones quedó destrozado y se reemplaza entero.
 * Reconstruido a partir del docx original, que lista las opciones completas.
 */
const OPCIONES_COMPLETAS: {
  id: string
  opciones: Opcion[]
  respuesta_correcta: string
  nota: string
}[] = [
  {
    // docx: a. Mieloma / b. C. / c. de Próstata / d. C. / e. C. / f. de Mama /
    //       g. Carcinoma Basocelular / h. de Pulmón
    // "Ca. de Próstata" etc. quedaron partidos en dos opciones.
    id: 'cmrzxftsq01egvwua10u3wcqo',
    opciones: [
      { letra: 'A', texto: 'Mieloma' },
      { letra: 'B', texto: 'Ca. de Próstata' },
      { letra: 'C', texto: 'Ca. de Mama' },
      { letra: 'D', texto: 'Carcinoma Basocelular' },
      { letra: 'E', texto: 'Ca. de Pulmón' },
    ],
    respuesta_correcta: 'D',
    nota: 'opciones "Ca. de X" partidas por el export; el docx marca Carcinoma Basocelular como correcta',
  },
]

// ---------------------------------------------------------------------------
// 2. Cruce automático contra los docx para corregir respuesta_correcta
// ---------------------------------------------------------------------------
type Original = { enunciado: string; opciones: string[]; correcta: string }

function parsearDocx(texto: string): Original[] {
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean)
  const out: Original[] = []
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i] !== 'Enunciado de la pregunta') continue
    let j = i + 1
    const enun: string[] = []
    while (j < lineas.length && lineas[j] !== 'Seleccione una:' && lineas[j] !== 'Enunciado de la pregunta') {
      enun.push(lineas[j]); j++
    }
    if (lineas[j] !== 'Seleccione una:') continue
    j++
    const opciones: string[] = []
    while (j < lineas.length && /^[a-z]\.\s*/.test(lineas[j])) { opciones.push(lineas[j].replace(/^[a-z]\.\s*/, '')); j++ }
    let correcta = ''
    for (let k = j; k < Math.min(j + 12, lineas.length); k++) {
      const m = lineas[k].match(/^La respuesta correcta es:\s*(.+)$/)
      if (m) { correcta = m[1].trim(); break }
      if (lineas[k] === 'Enunciado de la pregunta') break
    }
    if (opciones.length && correcta) out.push({ enunciado: enun.join(' '), opciones, correcta })
  }
  return out
}

async function main() {
  console.log(APLICAR ? '>> MODO ESCRITURA\n' : '>> SIMULACIÓN (usa --aplicar para escribir)\n')

  const originales: Original[] = []
  for (const f of fs.readdirSync(DIR_BOSQUE).filter(f => f.toLowerCase().endsWith('.docx'))) {
    originales.push(...parsearDocx((await mammoth.extractRawText({ path: path.join(DIR_BOSQUE, f) })).value))
  }
  const porEnunciado = new Map<string, Original>()
  const porOpciones = new Map<string, Original>()
  for (const o of originales) {
    porEnunciado.set(norm(o.enunciado).slice(0, 120), o)
    porOpciones.set(o.opciones.map(norm).sort().join('¶'), o)
  }

  const idsManuales = new Set([
    ...ENUNCIADOS.map(f => f.id), ...OPCIONES.map(f => f.id), ...OPCIONES_COMPLETAS.map(f => f.id),
  ])

  const preguntas = await prisma.pregunta.findMany({
    where: { fuente: 'Banco El Bosque (Moodle)' },
    select: { id: true, enunciado: true, opciones: true, respuesta_correcta: true },
  })
  const porId = new Map(preguntas.map(p => [p.id, p]))

  let nEnun = 0, nOpc = 0, nResp = 0
  const saltados: string[] = []
  const pendientes: string[] = []

  // --- reconstrucciones de enunciado ---
  const cambiosEnun = new Map<string, string>()
  for (const fix of ENUNCIADOS) {
    const actual = cambiosEnun.get(fix.id) ?? porId.get(fix.id)?.enunciado
    if (actual === undefined) { saltados.push(`${fix.id}: no está en la base`); continue }
    // idempotente: si ya está reparado, no vuelvas a aplicarlo
    if (fix.poner && actual.includes(fix.poner)) continue
    if (!actual.includes(fix.buscar)) { saltados.push(`${fix.id}: no encontré «${fix.buscar}»`); continue }
    cambiosEnun.set(fix.id, actual.replace(fix.buscar, fix.poner))
  }
  for (const [id, nuevo] of cambiosEnun) {
    console.log(`ENUNCIADO [${id}]\n   antes: ${porId.get(id)!.enunciado.slice(0, 150)}\n   ahora: ${nuevo.slice(0, 150)}`)
    if (APLICAR) await prisma.pregunta.update({ where: { id }, data: { enunciado: nuevo } })
    nEnun++
  }

  // --- reconstrucciones de opciones ---
  const cambiosOpc = new Map<string, Opcion[]>()
  for (const fix of OPCIONES) {
    const p = porId.get(fix.id)
    if (!p) { saltados.push(`${fix.id}: no está en la base`); continue }
    const ops = cambiosOpc.get(fix.id) ?? structuredClone(p.opciones as unknown as Opcion[])
    const op = ops.find(o => o.letra === fix.letra)
    if (op && op.texto.includes(fix.poner)) continue // ya reparado
    if (!op || !op.texto.includes(fix.buscar)) { saltados.push(`${fix.id} ${fix.letra}: no encontré «${fix.buscar}»`); continue }
    op.texto = op.texto.replace(fix.buscar, fix.poner)
    cambiosOpc.set(fix.id, ops)
  }
  for (const full of OPCIONES_COMPLETAS) {
    if (!porId.has(full.id)) { saltados.push(`${full.id}: no está en la base`); continue }
    cambiosOpc.set(full.id, full.opciones)
  }
  // "**" residual del GIFT: marcaba la correcta, así que hay que quitarlo siempre.
  for (const p of preguntas) {
    const base = cambiosOpc.get(p.id) ?? (p.opciones as unknown as Opcion[])
    if (!base.some(o => /\*\*+\s*$/.test(o.texto))) continue
    cambiosOpc.set(p.id, base.map(o => ({ ...o, texto: limpiarAsteriscos(o.texto) })))
  }
  for (const [id, ops] of cambiosOpc) {
    const full = OPCIONES_COMPLETAS.find(f => f.id === id)
    console.log(`OPCIONES  [${id}] -> ${ops.map(o => `${o.letra}) ${o.texto}`).join(' | ').slice(0, 190)}`)
    if (APLICAR) {
      await prisma.pregunta.update({
        where: { id },
        data: {
          opciones: ops as never,
          ...(full ? { respuesta_correcta: full.respuesta_correcta } : {}),
        },
      })
    }
    nOpc++
  }

  // --- respuesta_correcta contra el original ---
  for (const p of preguntas) {
    if (OPCIONES_COMPLETAS.some(f => f.id === p.id)) continue // ya resuelta arriba
    const ops = (p.opciones as unknown as Opcion[]) ?? []
    const orig =
      porEnunciado.get(norm(p.enunciado).slice(0, 120)) ??
      porOpciones.get(ops.map(o => norm(o.texto)).sort().join('¶'))
    if (!orig) continue
    const elegida = ops.find(o => o.letra === p.respuesta_correcta)
    if (elegida && norm(elegida.texto) === norm(orig.correcta)) continue

    let candidatas = ops.filter(o => norm(o.texto) === norm(orig.correcta))
    if (candidatas.length !== 1) {
      // Sin match exacto: acepta el más parecido solo si es muy similar y
      // saca clara ventaja al segundo (evita elegir entre opciones gemelas).
      const puntuadas = ops
        .map(o => ({ o, s: similitud(norm(o.texto), norm(orig.correcta)) }))
        .sort((a, b) => b.s - a.s)
      if (puntuadas[0]?.s >= 0.8 && puntuadas[0].s - (puntuadas[1]?.s ?? 0) >= 0.25) {
        candidatas = [puntuadas[0].o]
      }
    }
    if (candidatas.length !== 1) {
      pendientes.push(
        `[${p.id}] ${p.enunciado.slice(0, 80).replace(/\s+/g, ' ')}\n` +
        `      base: ${p.respuesta_correcta}) ${elegida?.texto ?? '?'}\n` +
        `      docx: ${orig.correcta}\n` +
        `      ops:  ${ops.map(o => `${o.letra}) ${o.texto}`).join(' | ').slice(0, 160)}`
      )
      continue
    }
    const letra = candidatas[0].letra
    if (letra === p.respuesta_correcta) continue // ya apunta bien
    console.log(`RESPUESTA [${p.id}] ${p.respuesta_correcta} -> ${letra}  (${orig.correcta.slice(0, 60)})`)
    if (APLICAR) await prisma.pregunta.update({ where: { id: p.id }, data: { respuesta_correcta: letra } })
    nResp++
    if (idsManuales.has(p.id)) { /* también tocada arriba; ok */ }
  }

  console.log(`\n== Resumen ==`)
  console.log(`enunciados reconstruidos : ${nEnun}`)
  console.log(`opciones reparadas       : ${nOpc}`)
  console.log(`respuesta_correcta fijada: ${nResp}`)
  if (saltados.length) {
    console.log(`\n-- entradas saltadas (${saltados.length}) --`)
    saltados.forEach(s => console.log('   ' + s))
  }
  if (pendientes.length) {
    console.log(`\n-- REQUIEREN REVISIÓN MANUAL (${pendientes.length}) --`)
    pendientes.forEach(s => console.log('   ' + s + '\n'))
  }
  if (!APLICAR) console.log('\n(No se escribió nada. Repite con --aplicar.)')
  await prisma.$disconnect()
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
