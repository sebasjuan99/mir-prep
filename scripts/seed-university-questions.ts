/**
 * scripts/seed-university-questions.ts
 *
 * Extracts medical exam questions from PDFs/DOCXs and seeds them into the DB.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-xxx npx tsx scripts/seed-university-questions.ts
 *
 * Prerequisites:
 *   - DATABASE_URL / DIRECT_URL in .env.local
 *   - ANTHROPIC_API_KEY env var
 *   - pdf-parse and mammoth installed (already in package.json)
 *   - Source files in D:/Mir_Prep preguntas/
 */

import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const adapter = new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter } as any)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASE_DIR = 'D:/Mir_Prep preguntas'

const FILES = [
  { file: 'UNAL 2025 - Mayo.pdf',                                 universidad: 'UNAL',      anio: 2025, fuente: 'UNAL Mayo 2025' },
  { file: 'UNAL 2024 reconstrucción exam admisión .docx',         universidad: 'UNAL',      anio: 2024, fuente: 'UNAL 2024 Reconstrucción' },
  { file: 'Examenes UNAL.pdf',                                    universidad: 'UNAL',      anio: 2023, fuente: 'UNAL Exámenes' },
  { file: 'Universidad del Rosario  2023.pdf',                    universidad: 'Rosario',   anio: 2023, fuente: 'Rosario 2023' },
  { file: 'Reconstrucción bosque 2025-1.pdf',                     universidad: 'El Bosque', anio: 2025, fuente: 'El Bosque 2025-1' },
  { file: 'Reconstrucción 2025-1.pdf',                            universidad: 'El Bosque', anio: 2025, fuente: 'El Bosque 2025 General' },
  { file: 'Banco de preguntas Universidad El Bosque (2).pdf',     universidad: 'El Bosque', anio: 2023, fuente: 'El Bosque Banco (2)' },
  { file: 'Banco de preguntas Universidad El Bosque (3) (1).pdf', universidad: 'El Bosque', anio: 2023, fuente: 'El Bosque Banco (3)' },
  { file: 'BANCO_DE_PREGUNTAS_ENARM.pdf',                         universidad: 'ENARM',     anio: 2024, fuente: 'Banco ENARM' },
]

interface ParsedQuestion {
  enunciado: string
  opciones: { letra: string; texto: string }[]
  respuesta_correcta: string
  especialidad: string
  tema: string
  dificultad: string
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  const buffer = fs.readFileSync(filePath)
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  return result.text
}

async function extractTextFromDocx(filePath: string): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

async function parseQuestionsWithClaude(text: string, universidad: string, anio: number): Promise<ParsedQuestion[]> {
  const CHUNK_SIZE = 40000
  const allQuestions: ParsedQuestion[] = []

  // Split into chunks if text is large
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE))
  }

  console.log(`  Parsing ${chunks.length} chunk(s) via Claude...`)

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx]
    if (chunk.trim().length < 200) continue

    console.log(`  Chunk ${idx + 1}/${chunks.length} (${chunk.length} chars)`)

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: `Extract ALL multiple choice medical exam questions from this ${universidad} ${anio} exam text.

Return a JSON array of questions. Each question object must have:
- "enunciado": complete question text including clinical scenario
- "opciones": array of { "letra": "A", "texto": "..." } (letters A through D or E)
- "respuesta_correcta": the correct answer letter (e.g. "A")
- "especialidad": medical specialty in Spanish (e.g. "Cardiología", "Pediatría", "Cirugía", "Medicina Interna")
- "tema": specific topic within the specialty
- "dificultad": "alta" | "media" | "baja"

Rules:
- Extract ONLY complete questions with clearly defined options
- If the correct answer is not shown, make your best clinical judgment
- Ignore administrative text, instructions, or incomplete questions
- Return ONLY the JSON array, no markdown, no explanations

Exam text:
${chunk}`
        }]
      })

      const raw = (response.content[0] as any).text.trim()

      // Extract JSON array from response
      let parsed: ParsedQuestion[] = []
      try {
        // Try direct parse first
        parsed = JSON.parse(raw)
      } catch {
        // Try to find array in text
        const match = raw.match(/\[[\s\S]*\]/)
        if (match) {
          try {
            parsed = JSON.parse(match[0])
          } catch {
            console.warn(`  Could not parse JSON from chunk ${idx + 1}, skipping`)
            continue
          }
        } else {
          console.warn(`  No JSON array found in chunk ${idx + 1} response, skipping`)
          continue
        }
      }

      if (Array.isArray(parsed)) {
        // Validate each question
        const valid = parsed.filter(q =>
          q.enunciado?.length > 20 &&
          Array.isArray(q.opciones) &&
          q.opciones.length >= 4 &&
          q.respuesta_correcta?.match(/^[A-E]$/)
        )
        console.log(`  Chunk ${idx + 1}: extracted ${valid.length} valid questions`)
        allQuestions.push(...valid)
      }
    } catch (err) {
      console.error(`  Error processing chunk ${idx + 1}:`, err)
    }

    // Small delay between chunks to avoid rate limiting
    if (idx < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return allQuestions
}

async function seedFile(fileConfig: typeof FILES[0]) {
  const filePath = path.join(BASE_DIR, fileConfig.file)

  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP: File not found: ${filePath}`)
    return 0
  }

  console.log(`\nProcessing: ${fileConfig.file}`)
  console.log(`  Universidad: ${fileConfig.universidad} | Año: ${fileConfig.anio}`)

  // Extract text
  let text = ''
  try {
    if (fileConfig.file.endsWith('.pdf')) {
      text = await extractTextFromPdf(filePath)
    } else if (fileConfig.file.endsWith('.docx')) {
      text = await extractTextFromDocx(filePath)
    } else {
      console.warn(`  SKIP: Unknown file type`)
      return 0
    }
  } catch (err) {
    console.error(`  Text extraction failed:`, err)
    return 0
  }

  if (text.trim().length < 100) {
    console.warn(`  SKIP: Extracted text too short (${text.length} chars) - file may be image-based`)
    return 0
  }

  console.log(`  Extracted ${text.length} characters`)

  // Parse questions
  const questions = await parseQuestionsWithClaude(text, fileConfig.universidad, fileConfig.anio)
  console.log(`  Total questions parsed: ${questions.length}`)

  if (questions.length === 0) return 0

  // Save to JSON for review
  const outputPath = path.join(__dirname, 'data', `${fileConfig.universidad.replace(' ', '_').toLowerCase()}_${fileConfig.anio}.json`)
  fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2))
  console.log(`  Saved to ${outputPath}`)

  // Seed to DB
  let inserted = 0
  for (const q of questions) {
    try {
      await prisma.pregunta.create({
        data: {
          enunciado: q.enunciado,
          opciones: q.opciones,
          respuesta_correcta: q.respuesta_correcta,
          especialidad: q.especialidad,
          tema: q.tema,
          dificultad: q.dificultad || 'media',
          anio: fileConfig.anio,
          universidad: fileConfig.universidad,
          fuente: fileConfig.fuente,
        },
      })
      inserted++
    } catch (err: any) {
      // Skip duplicate or invalid entries
      if (!err.message?.includes('Unique constraint')) {
        console.warn(`  DB insert error:`, err.message)
      }
    }
  }

  console.log(`  Inserted ${inserted}/${questions.length} questions into DB`)
  return inserted
}

async function main() {
  console.log('=== University Questions Seeder ===\n')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY env var is required')
    console.error('Usage: ANTHROPIC_API_KEY=sk-ant-xxx npx tsx scripts/seed-university-questions.ts')
    process.exit(1)
  }

  // Ensure data directory exists
  const dataDir = path.join(__dirname, 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  let totalInserted = 0

  for (const fileConfig of FILES) {
    const count = await seedFile(fileConfig)
    totalInserted += count
  }

  console.log(`\n=== Done: ${totalInserted} total questions inserted ===`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
