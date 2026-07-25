/**
 * scripts/muestra-preguntas.ts
 *
 * Muestra preguntas reales de un examen para analizar su ESTILO/patrón.
 * Lo usa la skill `patrones-preguntas` para derivar la "huella de estilo" de
 * una universidad antes de generar preguntas nuevas que la imiten.
 *
 * Uso:
 *   npx tsx scripts/muestra-preguntas.ts <CODIGO> [n]        # muestra n ejemplos (default 25)
 *   npx tsx scripts/muestra-preguntas.ts <CODIGO> [n] --stats  # + estadísticas de estilo
 *   npx tsx scripts/muestra-preguntas.ts --list               # lista los exámenes disponibles
 *
 * Ej: npx tsx scripts/muestra-preguntas.ts UNAL 30 --stats
 */
import path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!) } as any)

function classify(q: any) {
  const e: string = q.enunciado || ''
  const words = e.split(/\s+/).length
  const opts = Array.isArray(q.opciones) ? q.opciones.length : 0
  const vf = opts === 2
  const negativa = /\b(EXCEPTO|FALSO|NO es|NO corresponde|incorrect|menos probable|NUNCA)\b/i.test(e)
  const caso = /\b(paciente|masculino|femenina|mujer de|hombre de|a[ñn]os|lactante|reci[eé]n nacido|consulta por|acude)\b/i.test(e) && words > 25
  return { words, opts, vf, negativa, caso }
}

async function main() {
  const args = process.argv.slice(2)
  if (args[0] === '--list') {
    const tipos = await prisma.tipoExamen.findMany({ orderBy: { codigo: 'asc' } })
    for (const t of tipos) {
      const n = await prisma.pregunta.count({ where: { tipoExamen_id: t.id } })
      console.log(`${t.codigo.padEnd(11)} ${String(t.nombre).padEnd(14)} ${n}`)
    }
    await prisma.$disconnect(); return
  }

  const codigo = (args[0] || '').toUpperCase()
  const n = parseInt(args[1]) || 25
  const stats = args.includes('--stats')
  const tipo = await prisma.tipoExamen.findUnique({ where: { codigo } })
  if (!tipo) { console.error(`No existe el examen ${codigo}. Usa --list para ver los códigos.`); process.exit(1) }

  const total = await prisma.pregunta.count({ where: { tipoExamen_id: tipo.id } })
  // muestra pseudo-aleatoria estable: trae hasta 400 y toma un paso uniforme
  const pool = await prisma.pregunta.findMany({
    where: { tipoExamen_id: tipo.id },
    select: { enunciado: true, opciones: true, respuesta_correcta: true, especialidad: true, tema: true, dificultad: true, fuente: true },
    take: 400,
  })
  const step = Math.max(1, Math.floor(pool.length / n))
  const sample = pool.filter((_, i) => i % step === 0).slice(0, n)

  console.log(`=== ${codigo} (${tipo.nombre}) — ${total} preguntas en total, muestra de ${sample.length} ===\n`)

  if (stats) {
    const c = pool.map(classify)
    const pct = (x: number) => Math.round((x / c.length) * 100)
    const espChart: Record<string, number> = {}
    for (const q of pool) espChart[q.especialidad] = (espChart[q.especialidad] || 0) + 1
    const topEsp = Object.entries(espChart).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([k, v]) => `${k} ${Math.round((v / pool.length) * 100)}%`).join(', ')
    console.log(`ESTADÍSTICAS (sobre ${c.length}):`)
    console.log(`  palabras/enunciado: min ${Math.min(...c.map(x => x.words))} · mediana ${c.map(x => x.words).sort((a, b) => a - b)[Math.floor(c.length / 2)]} · max ${Math.max(...c.map(x => x.words))}`)
    console.log(`  caso clínico (viñeta larga): ${pct(c.filter(x => x.caso).length)}%`)
    console.log(`  fraseo negativo (EXCEPTO/FALSO/NO): ${pct(c.filter(x => x.negativa).length)}%`)
    console.log(`  Verdadero/Falso (2 opciones): ${pct(c.filter(x => x.vf).length)}%`)
    const optDist: Record<number, number> = {}
    for (const x of c) optDist[x.opts] = (optDist[x.opts] || 0) + 1
    console.log(`  nº de opciones: ${Object.entries(optDist).sort().map(([k, v]) => `${k}op=${pct(v)}%`).join(' · ')}`)
    console.log(`  dificultad: ${['baja', 'media', 'alta'].map(d => `${d} ${pct(pool.filter(q => q.dificultad === d).length)}%`).join(' · ')}`)
    console.log(`  especialidades top: ${topEsp}`)
    console.log('')
  }

  sample.forEach((q, i) => {
    console.log(`[${i + 1}] (${q.especialidad} / ${q.tema}${q.dificultad ? ' · ' + q.dificultad : ''})`)
    console.log(q.enunciado)
    for (const o of (q.opciones as any[])) console.log(`   ${o.letra}${o.letra === q.respuesta_correcta ? '*' : ' '}) ${o.texto}`)
    console.log('')
  })
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
