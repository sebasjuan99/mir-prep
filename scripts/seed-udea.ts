/**
 * scripts/seed-udea.ts
 *
 * Crea el TipoExamen de la Universidad de Antioquia (UdeA) e inserta sus
 * preguntas desde scripts/data/udea_2023|2024|2025.json.
 *
 * Uso:
 *   npx tsx scripts/seed-udea.ts
 *
 * Requisitos:
 *   - DATABASE_URL (o DIRECT_URL) en .env.local  ← cadena de conexión Postgres/Supabase
 *
 * Es idempotente: vuelve a correrlo sin duplicar (salta preguntas cuyo
 * enunciado ya exista para el examen UDEA).
 */

import fs from 'fs'
import path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  console.error('\n✗ Falta DATABASE_URL (o DIRECT_URL) en .env.local — no puedo conectar a la base.\n')
  process.exit(1)
}

const adapter = new PrismaPg(connectionString)
const prisma = new PrismaClient({ adapter } as any)

const FILES = [
  { file: 'scripts/data/udea_2023.json', anio: 2023 },
  { file: 'scripts/data/udea_2024.json', anio: 2024 },
  { file: 'scripts/data/udea_2025.json', anio: 2025 },
]

const EXAMEN = { codigo: 'UDEA', nombre: 'UdeA', descripcion: 'Universidad de Antioquia' }
const UNIVERSIDAD_LEGACY = 'UdeA'

interface Opcion { letra: string; texto: string }
interface Pregunta {
  enunciado: string
  opciones: Opcion[]
  respuesta_correcta: string
  especialidad: string
  tema: string
  subtema?: string
  dificultad?: string
  imagen_url?: string
  video_url?: string
}
interface SetFile { examen: string; anio: number; fuente: string; preguntas: Pregunta[] }

function valida(q: Pregunta): string | null {
  if (!q.enunciado || q.enunciado.length < 20) return 'enunciado corto/ausente'
  if (!Array.isArray(q.opciones) || q.opciones.length < 4 || q.opciones.length > 5) return `opciones=${q.opciones?.length}`
  const letras = q.opciones.map((o) => o.letra)
  if (!/^[A-E]$/.test(q.respuesta_correcta || '')) return `respuesta_correcta="${q.respuesta_correcta}"`
  if (!letras.includes(q.respuesta_correcta)) return `respuesta ${q.respuesta_correcta} no está en opciones`
  if (!q.especialidad) return 'sin especialidad'
  if (!q.tema) return 'sin tema'
  if (q.dificultad && !['baja', 'media', 'alta'].includes(q.dificultad)) return `dificultad="${q.dificultad}"`
  return null
}

async function main() {
  console.log('=== Seed UdeA ===\n')

  // 1) TipoExamen (crea o reutiliza por codigo)
  const tipoExamen = await prisma.tipoExamen.upsert({
    where: { codigo: EXAMEN.codigo },
    update: { nombre: EXAMEN.nombre, descripcion: EXAMEN.descripcion, activo: true },
    create: { codigo: EXAMEN.codigo, nombre: EXAMEN.nombre, descripcion: EXAMEN.descripcion, activo: true },
  })
  console.log(`TipoExamen UDEA listo (id=${tipoExamen.id})\n`)

  let totalInsert = 0
  let totalSkipDup = 0
  let totalInvalid = 0

  for (const f of FILES) {
    const raw = fs.readFileSync(path.resolve(__dirname, '..', f.file), 'utf-8')
    const data: SetFile = JSON.parse(raw)
    console.log(`[${f.anio}] ${data.preguntas.length} preguntas — fuente "${data.fuente}"`)

    let ins = 0, dup = 0, inv = 0
    for (const q of data.preguntas) {
      const err = valida(q)
      if (err) { inv++; console.warn(`  ⚠ inválida: ${err} — "${q.enunciado?.slice(0, 50)}..."`); continue }

      const existe = await prisma.pregunta.findFirst({
        where: { enunciado: q.enunciado, tipoExamen_id: tipoExamen.id },
        select: { id: true },
      })
      if (existe) { dup++; continue }

      await prisma.pregunta.create({
        data: {
          enunciado: q.enunciado,
          opciones: q.opciones as any,
          respuesta_correcta: q.respuesta_correcta,
          especialidad: q.especialidad,
          tema: q.tema,
          subtema: q.subtema || null,
          dificultad: q.dificultad || 'media',
          imagen_url: q.imagen_url || null,
          video_url: q.video_url || null,
          anio: data.anio ?? f.anio,
          universidad: UNIVERSIDAD_LEGACY,
          fuente: data.fuente,
          tipoExamen_id: tipoExamen.id,
        },
      })
      ins++
    }
    console.log(`  → insertadas: ${ins} | duplicadas (saltadas): ${dup} | inválidas: ${inv}\n`)
    totalInsert += ins; totalSkipDup += dup; totalInvalid += inv
  }

  const totalUdea = await prisma.pregunta.count({ where: { tipoExamen_id: tipoExamen.id } })
  console.log(`=== Fin: ${totalInsert} insertadas, ${totalSkipDup} duplicadas, ${totalInvalid} inválidas ===`)
  console.log(`Total de preguntas UDEA en la base ahora: ${totalUdea}`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
