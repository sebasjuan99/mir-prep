import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'

// A4 dimensions in points (72pt/inch)
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 28.35     // 10mm
const GUTTER = 11.34     // 4mm
const COLS = 3
const ROWS = 4
// Card size computed to fill A4 with 3 cols × 4 rows
const CARD_W = (PAGE_W - 2 * MARGIN - (COLS - 1) * GUTTER) / COLS  // ≈153pt
const CARD_H = (PAGE_H - 2 * MARGIN - (ROWS - 1) * GUTTER) / ROWS  // ≈188pt

type Flashcard = {
  id: string
  pregunta: string
  respuesta: string
  especialidad: string
  tipoExamen: string
  consejo: string
}

function cardX(col: number) { return MARGIN + col * (CARD_W + GUTTER) }
function cardY(row: number) { return MARGIN + row * (CARD_H + GUTTER) }

function drawFront(doc: PDFKit.PDFDocument, card: Flashcard, x: number, y: number) {
  doc.save()
  // Cream background
  doc.rect(x, y, CARD_W, CARD_H).fill('#f5f0e8')
  doc.rect(x, y, CARD_W, CARD_H).stroke('#1a1a18')
  // Orange accent bar
  doc.rect(x + 10, y + 10, 20, 3).fill('#E84A1F')
  // Specialty tag
  doc.fontSize(5).fillColor('#1a1a18').opacity(0.5)
    .text(card.especialidad.toUpperCase(), x + 10, y + 18, { width: CARD_W - 20 })
  // Question
  doc.fontSize(8).fillColor('#1a1a18').opacity(1)
    .text(card.pregunta, x + 10, y + 30, { width: CARD_W - 20, height: CARD_H - 60, align: 'left' })
  // Footer label
  doc.fontSize(5).fillColor('#1a1a18').opacity(0.4)
    .text('PREGUNTA', x + 10, y + CARD_H - 16, { width: CARD_W - 20 })
  doc.restore()
}

function drawBack(doc: PDFKit.PDFDocument, card: Flashcard, x: number, y: number) {
  doc.save()
  // Dark background
  doc.rect(x, y, CARD_W, CARD_H).fill('#1a1a18')
  doc.rect(x, y, CARD_W, CARD_H).stroke('#1a1a18')
  // Orange accent bar
  doc.rect(x + 10, y + 10, 20, 3).fill('#E84A1F')
  // Specialty tag
  doc.fontSize(5).fillColor('#f5f0e8').opacity(0.5)
    .text(card.especialidad.toUpperCase(), x + 10, y + 18, { width: CARD_W - 20 })
  // Answer
  doc.fontSize(7.5).fillColor('#f5f0e8').opacity(1)
    .text(card.respuesta, x + 10, y + 30, { width: CARD_W - 20, height: CARD_H - 80, align: 'left' })
  // Consejo divider + text
  const consejoY = y + CARD_H - 44
  doc.moveTo(x + 10, consejoY).lineTo(x + CARD_W - 10, consejoY).stroke('#f5f0e8')
  doc.fontSize(5).fillColor('#f5f0e8').opacity(0.5)
    .text('CONSEJO', x + 10, consejoY + 4, { width: CARD_W - 20 })
  doc.fontSize(6).fillColor('#f5f0e8').opacity(0.7)
    .text(card.consejo, x + 10, consejoY + 12, { width: CARD_W - 20, height: 24 })
  // Footer label
  doc.fontSize(5).fillColor('#f5f0e8').opacity(0.4)
    .text('RESPUESTA', x + 10, y + CARD_H - 16, { width: CARD_W - 20 })
  doc.restore()
}

function drawCutGuide(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.save()
  doc.dash(2, { space: 2 })
  doc.rect(x, y, CARD_W, CARD_H).stroke('#cccccc')
  doc.undash()
  doc.restore()
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({ where: { auth_id: user.id } })
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const especialidad = searchParams.get('especialidad')
  const tipoExamen = searchParams.get('tipoExamen')

  const flashcards = await prisma.flashcard.findMany({
    where: {
      usuarioId: usuario.id,
      ...(especialidad ? { especialidad } : {}),
      ...(tipoExamen ? { tipoExamen } : {}),
    },
    orderBy: [{ especialidad: 'asc' }, { creadoEn: 'asc' }],
  }) as Flashcard[]

  if (flashcards.length === 0) {
    return NextResponse.json({ error: 'No hay flashcards para exportar' }, { status: 404 })
  }

  const CARDS_PER_PAGE = COLS * ROWS

  const chunks: Flashcard[][] = []
  for (let i = 0; i < flashcards.length; i += CARDS_PER_PAGE) {
    chunks.push(flashcards.slice(i, i + CARDS_PER_PAGE))
  }

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false })
  const buffers: Buffer[] = []
  doc.on('data', (chunk: Buffer) => buffers.push(chunk))

  // Register 'end' listener BEFORE calling doc.end() to avoid race condition
  const pdfDone = new Promise<void>((resolve) => doc.on('end', resolve))

  for (const chunk of chunks) {
    // Page 1: fronts in normal column order (col 0, 1, 2)
    doc.addPage()
    chunk.forEach((card, i) => {
      const row = Math.floor(i / COLS)
      const col = i % COLS
      drawFront(doc, card, cardX(col), cardY(row))
      drawCutGuide(doc, cardX(col), cardY(row))
    })

    // Page 2: backs in mirrored column order (col 2, 1, 0)
    // When the front page is flipped horizontally for double-sided printing,
    // front[row,col0] aligns with back at position[row,col2], etc.
    doc.addPage()
    chunk.forEach((card, i) => {
      const row = Math.floor(i / COLS)
      const mirroredCol = (COLS - 1) - (i % COLS)
      drawBack(doc, card, cardX(mirroredCol), cardY(row))
      drawCutGuide(doc, cardX(mirroredCol), cardY(row))
    })
  }

  doc.end()

  await pdfDone

  const pdf = Buffer.concat(buffers)
  const filename = `flashcards-mir-prep.pdf`

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdf.length),
    },
  })
}
