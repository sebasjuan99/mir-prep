import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { decryptApiKey } from '@/lib/crypto'
import type { TextBlock } from '@anthropic-ai/sdk/resources/messages'
import { PDFParse } from 'pdf-parse'

const MAX_TEXT_CHARS = 80_000

const EXAM_LABELS: Record<string, string> = {
  MIR: 'MIR (España)',
  ENARM: 'ENARM (México)',
  'U.Rosario': 'U. del Rosario',
  'U.Bosque': 'U. del Bosque',
  USMLE: 'USMLE (EE.UU.)',
}

function buildSystemPrompt(tipoExamen: string, count: number): string {
  const label = EXAM_LABELS[tipoExamen] ?? tipoExamen
  return `Eres un experto en preparación para el examen ${label}.
Genera exactamente ${count} flashcards médicas en formato JSON a partir del texto del documento.

Cada flashcard debe ser un objeto con exactamente estos campos:
- "pregunta": pregunta concisa, estilo ${label}, que evalúe un concepto clave del texto
- "respuesta": respuesta directa, completa y clara
- "especialidad": especialidad médica detectada del contexto (ej. "Cardiología", "Neurología", "Pediatría")
- "consejo": consejo de estudio específico para ${label}, empezando con "En el ${label}..."

Responde ÚNICAMENTE con un array JSON válido. Sin markdown, sin bloques de código, sin texto adicional.`
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
    select: { claudeApiKeyEnc: true },
  })

  if (!usuario?.claudeApiKeyEnc) {
    return NextResponse.json({ error: 'Configura tu API key de Claude primero' }, { status: 400 })
  }

  let apiKey: string
  try {
    apiKey = decryptApiKey(usuario.claudeApiKeyEnc)
  } catch {
    return NextResponse.json({ error: 'Error al leer la API key. Por favor reconfígurala.' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const count = parseInt((formData.get('count') as string) || '10')
  const tipoExamen = (formData.get('tipoExamen') as string) || 'MIR'

  if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'El archivo no puede superar 10 MB' }, { status: 400 })
  if (![10, 20, 30].includes(count)) return NextResponse.json({ error: 'La cantidad debe ser 10, 20 o 30' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let text = ''

  try {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const result = await parser.getText()
      text = result.text
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return NextResponse.json({ error: 'Solo se aceptan archivos PDF o DOCX' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el archivo. Verifica que no esté protegido.' }, { status: 422 })
  }

  if (text.trim().length < 100) {
    return NextResponse.json({ error: 'El documento tiene muy poco texto. Verifica el archivo.' }, { status: 422 })
  }

  const truncated = text.slice(0, MAX_TEXT_CHARS)

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  let flashcards: Array<{ pregunta: string; respuesta: string; especialidad: string; consejo: string }>

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: buildSystemPrompt(tipoExamen, count),
      messages: [{ role: 'user', content: truncated }],
    })

    const raw = (message.content[0] as TextBlock).text
    flashcards = JSON.parse(raw)

    if (!Array.isArray(flashcards)) throw new Error('Response is not an array')
    flashcards = flashcards.filter(
      f => f.pregunta && f.respuesta && f.especialidad && f.consejo
    )
  } catch {
    return NextResponse.json(
      { error: 'Claude no pudo generar las flashcards. Intenta con un documento más estructurado.' },
      { status: 422 }
    )
  }

  return NextResponse.json({ flashcards, tipoExamen })
}
