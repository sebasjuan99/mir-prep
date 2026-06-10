/**
 * Reads parsed questions from the workflow output file and inserts into DB.
 * Usage: npx tsx scripts/insert-parsed-questions.ts
 */

import fs from 'fs'
import path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const adapter = new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter } as any)

const OUTPUT_FILE = process.argv[2] || 'C:/Users/SEBAST~1/AppData/Local/Temp/claude/C--Users-Sebastian/5a4d6573-8c8e-4227-af64-d44c24b13cea/tasks/wcigq10vf.output'

interface ParsedQuestion {
  enunciado: string
  opciones: { letra: string; texto: string }[]
  respuesta_correcta: string
  especialidad: string
  tema: string
  dificultad: string
}

interface ParsedFile {
  key: string
  universidad: string
  anio: number
  fuente: string
  questions: ParsedQuestion[]
}

async function main() {
  console.log('=== Insert Parsed University Questions ===\n')

  const raw = fs.readFileSync(OUTPUT_FILE, 'utf-8')
  const data = JSON.parse(raw)
  const files: ParsedFile[] = data.result

  let totalInserted = 0
  let totalSkipped = 0

  for (const file of files) {
    console.log(`\n[${file.key}] ${file.universidad} ${file.anio} — ${file.questions.length} questions`)

    let inserted = 0
    let skipped = 0

    for (const q of file.questions) {
      if (!q.enunciado || q.enunciado.length < 20) { skipped++; continue }
      if (!Array.isArray(q.opciones) || q.opciones.length < 4) { skipped++; continue }
      if (!q.respuesta_correcta?.match(/^[A-E]$/)) { skipped++; continue }

      try {
        await prisma.pregunta.create({
          data: {
            enunciado: q.enunciado,
            opciones: q.opciones as any,
            respuesta_correcta: q.respuesta_correcta,
            especialidad: q.especialidad || 'Medicina General',
            tema: q.tema || '',
            dificultad: q.dificultad || 'media',
            anio: file.anio,
            universidad: file.universidad,
            fuente: file.fuente,
          },
        })
        inserted++
      } catch (err: any) {
        if (!err.message?.includes('Unique constraint')) {
          console.warn(`  Insert error: ${err.message?.slice(0, 100)}`)
        }
        skipped++
      }
    }

    console.log(`  Inserted: ${inserted} | Skipped: ${skipped}`)
    totalInserted += inserted
    totalSkipped += skipped
  }

  console.log(`\n=== Done: ${totalInserted} inserted, ${totalSkipped} skipped ===`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
