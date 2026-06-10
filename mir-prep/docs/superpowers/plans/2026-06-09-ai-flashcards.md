# AI Flashcards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/flashcards` section where authenticated users upload a PDF/DOCX document, select exam type and count, and get AI-generated flashcards they can review, save, and download as a print-ready double-sided PDF.

**Architecture:** Next.js App Router API routes handle file parsing (server-side, in-memory) and Claude API calls using the user's own API key stored AES-256-GCM encrypted in the DB. The UI has three states on one route: generator form → preview (flip cards, batch save/discard) → dashboard (saved cards + PDF download).

**Tech Stack:** Next.js 16 App Router, Prisma 7 + PostgreSQL, `@anthropic-ai/sdk`, `pdf-parse`, `mammoth`, `pdfkit`, Node.js `crypto` (built-in), framer-motion (already installed), MIR Prep design system (`@/lib/cm`).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | Add `Flashcard` model + `claudeApiKeyEnc` to `Usuario` |
| Create | `src/lib/crypto.ts` | AES-256-GCM encrypt/decrypt for API keys |
| Modify | `src/components/NavBar.tsx` | Add FLASHCARDS IA nav entry |
| Create | `src/app/api/user/claude-key/route.ts` | GET (configured?) + POST (save/update key) |
| Create | `src/app/api/flashcards/generate/route.ts` | Parse file + call Claude → return preview array |
| Create | `src/app/api/flashcards/route.ts` | GET (list saved) + POST (save batch) |
| Create | `src/app/api/flashcards/[id]/route.ts` | DELETE single flashcard |
| Create | `src/app/api/flashcards/pdf/route.ts` | Generate double-sided PDF with pdfkit |
| Create | `src/components/flashcards/AiFlipCard.tsx` | 9:16 flip card UI component |
| Create | `src/components/flashcards/ApiKeyModal.tsx` | Modal to configure Claude API key |
| Create | `src/components/flashcards/GeneratorForm.tsx` | File upload + count + exam type form |
| Create | `src/app/(protected)/flashcards/page.tsx` | Main page (3 states: generate → preview → dashboard) |

---

## Task 1: Install Dependencies + Env Var

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Step 1: Install packages**

```bash
cd D:/residentes/mir-prep
npm install @anthropic-ai/sdk pdf-parse mammoth pdfkit
npm install --save-dev @types/pdf-parse @types/pdfkit @types/mammoth
```

Expected output: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Add env var to `.env.local`**

Generate a 32-byte hex key and add it. Run in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output, then add to `.env.local`:

```
FLASHCARD_ENCRYPTION_KEY=<paste_32_byte_hex_here>
```

- [ ] **Step 3: Add env var to Vercel**

In Vercel dashboard → Settings → Environment Variables, add:
- `FLASHCARD_ENCRYPTION_KEY` = same value as above (all environments)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install flashcards dependencies (anthropic, pdf-parse, mammoth, pdfkit)"
```

---

## Task 2: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `claudeApiKeyEnc` field to `Usuario` and new `Flashcard` model**

In `prisma/schema.prisma`, replace the `Usuario` model with:

```prisma
model Usuario {
  id                String      @id @default(cuid())
  auth_id           String      @unique
  email             String      @unique
  nombre            String?
  role              String      @default("user")
  activo            Boolean     @default(true)
  claudeApiKeyEnc   String?
  flashcards        Flashcard[]
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([auth_id])
  @@index([role])
}
```

Then add the `Flashcard` model at the end of the file:

```prisma
model Flashcard {
  id           String   @id @default(cuid())
  pregunta     String
  respuesta    String
  especialidad String
  tipoExamen   String
  consejo      String
  usuarioId    String
  usuario      Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  creadoEn     DateTime @default(now())

  @@index([usuarioId])
  @@index([usuarioId, especialidad])
  @@index([usuarioId, tipoExamen])
}
```

- [ ] **Step 2: Push schema to DB**

```bash
cd D:/residentes/mir-prep
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: Client generated to `src/generated/prisma`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Flashcard model and claudeApiKeyEnc to Usuario"
```

---

## Task 3: Crypto Utility

**Files:**
- Create: `src/lib/crypto.ts`

- [ ] **Step 1: Create the file**

Create `src/lib/crypto.ts`:

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.FLASHCARD_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('FLASHCARD_ENCRYPTION_KEY must be a 32-byte hex string (64 chars)')
  }
  return Buffer.from(hex, 'hex')
}

export function encryptApiKey(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptApiKey(stored: string): string {
  const key = getKey()
  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted key format')
  const [ivHex, tagHex, cipherHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(cipherHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
```

- [ ] **Step 2: Verify encrypt/decrypt round-trips in Node**

```bash
cd D:/residentes/mir-prep
node -e "
const { encryptApiKey, decryptApiKey } = require('./src/lib/crypto.ts')
" 
```

Note: this will fail because of TypeScript. Instead, verify during integration in Task 5. Skip to commit.

- [ ] **Step 3: Commit**

```bash
git add src/lib/crypto.ts
git commit -m "feat: add AES-256-GCM encrypt/decrypt for Claude API keys"
```

---

## Task 4: NavBar — Add FLASHCARDS IA

**Files:**
- Modify: `src/components/NavBar.tsx:14-18`

- [ ] **Step 1: Add the link to the `links` array**

In `src/components/NavBar.tsx`, replace:

```typescript
const links = [
  { href: '/dashboard',     label: 'DASHBOARD'     },
  { href: '/simulacro',     label: 'SIMULACRO'     },
  { href: '/especialidades', label: 'ESPECIALIDADES' },
]
```

With:

```typescript
const links = [
  { href: '/dashboard',     label: 'DASHBOARD'     },
  { href: '/simulacro',     label: 'SIMULACRO'     },
  { href: '/especialidades', label: 'ESPECIALIDADES' },
  { href: '/flashcards',    label: '✦ FLASHCARDS IA' },
]
```

- [ ] **Step 2: Verify in browser**

Run `npm run dev`, open `http://localhost:3000/dashboard`. Confirm "✦ FLASHCARDS IA" appears in the NavBar and highlights when on `/flashcards`.

- [ ] **Step 3: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: add FLASHCARDS IA entry to NavBar"
```

---

## Task 5: Claude API Key Endpoints

**Files:**
- Create: `src/app/api/user/claude-key/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/user/claude-key/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { encryptApiKey, decryptApiKey } from '@/lib/crypto'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
    select: { claudeApiKeyEnc: true },
  })

  return NextResponse.json({ configured: !!usuario?.claudeApiKeyEnc })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { apiKey } = body as { apiKey: string }

  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'API key inválida. Debe comenzar con sk-ant-' }, { status: 400 })
  }

  const encrypted = encryptApiKey(apiKey)

  await prisma.usuario.update({
    where: { auth_id: user.id },
    data: { claudeApiKeyEnc: encrypted },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify GET with curl (dev server running)**

```bash
# First get a session cookie by logging in, then:
curl http://localhost:3000/api/user/claude-key
```

Expected without auth: `{"error":"No autorizado"}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/claude-key/route.ts
git commit -m "feat: add GET/POST endpoints for Claude API key management"
```

---

## Task 6: Generate Endpoint

**Files:**
- Create: `src/app/api/flashcards/generate/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/flashcards/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { decryptApiKey } from '@/lib/crypto'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import Anthropic from '@anthropic-ai/sdk'

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
      const data = await pdfParse(buffer)
      text = data.text
    } else if (file.name.toLowerCase().endsWith('.docx')) {
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

  const client = new Anthropic({ apiKey })
  let flashcards: Array<{ pregunta: string; respuesta: string; especialidad: string; consejo: string }>

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: buildSystemPrompt(tipoExamen, count),
      messages: [{ role: 'user', content: truncated }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text
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
```

- [ ] **Step 2: Verify route exists (compile check)**

```bash
cd D:/residentes/mir-prep
npx tsc --noEmit
```

Fix any TypeScript errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/flashcards/generate/route.ts
git commit -m "feat: add flashcard generation endpoint (PDF/DOCX → Claude → preview array)"
```

---

## Task 7: Flashcards CRUD Endpoints

**Files:**
- Create: `src/app/api/flashcards/route.ts`
- Create: `src/app/api/flashcards/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/flashcards/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
    orderBy: { creadoEn: 'desc' },
  })

  return NextResponse.json({ flashcards })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({ where: { auth_id: user.id } })
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const body = await request.json()
  const { flashcards, tipoExamen } = body as {
    flashcards: Array<{ pregunta: string; respuesta: string; especialidad: string; consejo: string }>
    tipoExamen: string
  }

  if (!Array.isArray(flashcards) || flashcards.length === 0) {
    return NextResponse.json({ error: 'No hay flashcards para guardar' }, { status: 400 })
  }

  const saved = await prisma.flashcard.createMany({
    data: flashcards.map(f => ({
      pregunta: f.pregunta,
      respuesta: f.respuesta,
      especialidad: f.especialidad,
      consejo: f.consejo,
      tipoExamen,
      usuarioId: usuario.id,
    })),
  })

  return NextResponse.json({ saved: saved.count })
}
```

- [ ] **Step 2: Create `src/app/api/flashcards/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({ where: { auth_id: user.id } })
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const { id } = await params

  const card = await prisma.flashcard.findFirst({ where: { id, usuarioId: usuario.id } })
  if (!card) return NextResponse.json({ error: 'Flashcard no encontrada' }, { status: 404 })

  await prisma.flashcard.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/flashcards/route.ts src/app/api/flashcards/[id]/route.ts
git commit -m "feat: add flashcards GET/POST/DELETE endpoints"
```

---

## Task 8: PDF Generation Endpoint

**Files:**
- Create: `src/app/api/flashcards/pdf/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/flashcards/pdf/route.ts`:

```typescript
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

function drawFront(doc: InstanceType<typeof PDFDocument>, card: Flashcard, x: number, y: number) {
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
}

function drawBack(doc: InstanceType<typeof PDFDocument>, card: Flashcard, x: number, y: number) {
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
}

function drawCutGuide(doc: InstanceType<typeof PDFDocument>, x: number, y: number) {
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

  for (const chunk of chunks) {
    // Page 1: fronts in normal column order
    doc.addPage()
    chunk.forEach((card, i) => {
      const row = Math.floor(i / COLS)
      const col = i % COLS
      drawCutGuide(doc, cardX(col), cardY(row))
      drawFront(doc, card, cardX(col), cardY(row))
    })

    // Page 2: backs in mirrored column order (col 2,1,0)
    doc.addPage()
    chunk.forEach((card, i) => {
      const row = Math.floor(i / COLS)
      const mirroredCol = (COLS - 1) - (i % COLS)
      drawCutGuide(doc, cardX(mirroredCol), cardY(row))
      drawBack(doc, card, cardX(mirroredCol), cardY(row))
    })
  }

  doc.end()

  await new Promise<void>((resolve) => doc.on('end', resolve))

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
```

- [ ] **Step 2: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/flashcards/pdf/route.ts
git commit -m "feat: add PDF generation endpoint with double-sided print alignment"
```

---

## Task 9: AiFlipCard Component

**Files:**
- Create: `src/components/flashcards/AiFlipCard.tsx`

Note: The existing `src/components/FlashCard.tsx` is for simulacro quiz questions — keep it untouched. This is a new, separate component for 9:16 AI-generated cards.

- [ ] **Step 1: Create the component**

Create `src/components/flashcards/AiFlipCard.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'

export interface AiFlashcard {
  id?: string
  pregunta: string
  respuesta: string
  especialidad: string
  tipoExamen: string
  consejo: string
}

interface AiFlipCardProps {
  card: AiFlashcard
  onDelete?: (id: string) => void
}

export default function AiFlipCard({ card, onDelete }: AiFlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Flip container */}
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          width: 180,
          height: 320,
          cursor: 'pointer',
          perspective: 800,
          position: 'relative',
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* FRONT */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            border: `3px solid ${C.ink}`,
            background: C.cream,
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <div>
              <div style={{ ...mono, fontSize: 8, letterSpacing: '0.14em', color: C.ink, opacity: 0.5, marginBottom: 6 }}>
                {card.especialidad.toUpperCase()} · {card.tipoExamen}
              </div>
              <div style={{ width: 24, height: 3, background: '#E84A1F', marginBottom: 16 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ ...bodyFont, fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>
                {card.pregunta}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ ...mono, fontSize: 8, letterSpacing: '0.1em', color: C.ink, opacity: 0.4 }}>PREGUNTA</div>
              <div style={{ fontSize: 18, color: C.ink, opacity: 0.12 }}>✦</div>
            </div>
          </div>

          {/* BACK */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            border: `3px solid ${C.ink}`,
            background: C.ink,
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <div>
              <div style={{ ...mono, fontSize: 8, letterSpacing: '0.14em', color: C.cream, opacity: 0.5, marginBottom: 6 }}>
                {card.especialidad.toUpperCase()} · {card.tipoExamen}
              </div>
              <div style={{ width: 24, height: 3, background: '#E84A1F', marginBottom: 16 }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ ...bodyFont, fontSize: 11.5, color: C.cream, lineHeight: 1.5 }}>
                {card.respuesta}
              </div>
            </div>
            <div>
              <div style={{ borderTop: `1px solid rgba(245,240,232,0.15)`, paddingTop: 8, marginBottom: 4 }}>
                <div style={{ ...mono, fontSize: 7, letterSpacing: '0.1em', color: C.cream, opacity: 0.45, marginBottom: 3 }}>CONSEJO</div>
                <div style={{ ...bodyFont, fontSize: 9.5, color: C.cream, opacity: 0.7, lineHeight: 1.35 }}>
                  {card.consejo}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div style={{ ...mono, fontSize: 7, letterSpacing: '0.1em', color: C.cream, opacity: 0.35 }}>RESPUESTA</div>
                <div style={{ fontSize: 16, color: C.cream, opacity: 0.1 }}>✦</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div style={{ ...mono, fontSize: 8, letterSpacing: '0.08em', color: C.ink, opacity: 0.35 }}>
        {flipped ? 'click para volver' : 'click para ver respuesta'}
      </div>

      {/* Delete button (only when id is present = saved card) */}
      {onDelete && card.id && (
        <button
          onClick={() => onDelete(card.id!)}
          style={{
            ...mono, fontSize: 9, letterSpacing: '0.08em',
            background: 'transparent', border: inkBorder,
            color: C.ink, padding: '4px 10px', cursor: 'pointer', opacity: 0.5,
          }}
        >
          ELIMINAR
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/flashcards/AiFlipCard.tsx
git commit -m "feat: add AiFlipCard component (9:16 flip, cream/ink contrast)"
```

---

## Task 10: ApiKeyModal Component

**Files:**
- Create: `src/components/flashcards/ApiKeyModal.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/flashcards/ApiKeyModal.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'

interface ApiKeyModalProps {
  onClose: () => void
  onSaved: () => void
}

export default function ApiKeyModal({ onClose, onSaved }: ApiKeyModalProps) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')
    if (!key.startsWith('sk-ant-')) {
      setError('La API key debe comenzar con sk-ant-')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/user/claude-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
        return
      }
      onSaved()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: C.cream, border: inkBorder,
        padding: '48px 40px', width: '100%', maxWidth: 480,
      }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', marginBottom: 12, opacity: 0.5 }}>
          CONFIGURACIÓN
        </div>
        <h2 style={{ ...disp, fontSize: 28, margin: '0 0 8px' }}>API KEY DE CLAUDE</h2>
        <p style={{ ...bodyFont, fontSize: 14, opacity: 0.7, marginBottom: 28, lineHeight: 1.5 }}>
          Tu key se cifra con AES-256 antes de guardarse. Nunca la vemos en texto plano.
          Obtenla en <strong>console.anthropic.com</strong>.
        </p>

        {error && (
          <div style={{ ...mono, fontSize: 10, background: '#ffd0cc', border: inkBorder, padding: '10px 14px', marginBottom: 16 }}>
            {error.toUpperCase()}
          </div>
        )}

        <input
          type="password"
          placeholder="sk-ant-api03-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          style={{
            ...bodyFont, width: '100%', padding: '14px 16px',
            border: inkBorder, background: C.cream, color: C.ink,
            fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 20,
          }}
        />

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={loading || !key}
            style={{
              ...disp, fontSize: 13, flex: 1,
              background: loading ? '#888' : C.ink, color: C.cream,
              border: inkBorder, padding: '14px 20px', cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'GUARDANDO...' : 'GUARDAR →'}
          </button>
          <button
            onClick={onClose}
            style={{
              ...mono, fontSize: 11, background: 'transparent',
              border: inkBorder, color: C.ink, padding: '14px 20px', cursor: 'pointer',
            }}
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/flashcards/ApiKeyModal.tsx
git commit -m "feat: add ApiKeyModal component"
```

---

## Task 11: GeneratorForm Component

**Files:**
- Create: `src/components/flashcards/GeneratorForm.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/flashcards/GeneratorForm.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'
import { AiFlashcard } from '@/components/flashcards/AiFlipCard'

const EXAM_OPTIONS = ['MIR', 'ENARM', 'U.Rosario', 'U.Bosque', 'USMLE']
const COUNT_OPTIONS = [10, 20, 30]

interface GeneratorFormProps {
  keyConfigured: boolean
  onOpenKeyModal: () => void
  onGenerated: (cards: AiFlashcard[], tipoExamen: string) => void
}

export default function GeneratorForm({ keyConfigured, onOpenKeyModal, onGenerated }: GeneratorFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [count, setCount] = useState(10)
  const [tipoExamen, setTipoExamen] = useState('MIR')
  const [customExamen, setCustomExamen] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const effectiveTipoExamen = tipoExamen === 'OTRO' ? customExamen : tipoExamen

  const handleGenerate = async () => {
    if (!file || !effectiveTipoExamen.trim()) return
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('count', String(count))
      form.append('tipoExamen', effectiveTipoExamen.trim())

      const res = await fetch('/api/flashcards/generate', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al generar')
        return
      }

      onGenerated(data.flashcards, data.tipoExamen)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {/* API key status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, padding: '12px 16px', border: inkBorder, background: keyConfigured ? '#e8f4e8' : '#fff8e0' }}>
        <span style={{ fontSize: 16 }}>{keyConfigured ? '✓' : '⚠'}</span>
        <span style={{ ...mono, fontSize: 10, letterSpacing: '0.08em' }}>
          {keyConfigured ? 'API KEY CONFIGURADA' : 'API KEY NO CONFIGURADA'}
        </span>
        <button
          onClick={onOpenKeyModal}
          style={{ ...mono, fontSize: 9, marginLeft: 'auto', background: 'transparent', border: inkBorder, padding: '6px 12px', cursor: 'pointer' }}
        >
          {keyConfigured ? 'CAMBIAR' : 'CONFIGURAR →'}
        </button>
      </div>

      {error && (
        <div style={{ ...mono, fontSize: 10, background: '#ffd0cc', border: inkBorder, padding: '10px 14px', marginBottom: 20 }}>
          {error.toUpperCase()}
        </div>
      )}

      {/* File upload */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>01 — DOCUMENTO</div>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: `3px dashed ${C.ink}`, padding: '32px 24px', textAlign: 'center',
            cursor: 'pointer', background: file ? '#e8f4e8' : C.cream,
            transition: 'background 0.2s',
          }}
        >
          <div style={{ ...bodyFont, fontSize: 14, marginBottom: 6 }}>
            {file ? `✓ ${file.name}` : 'Arrastra tu PDF o DOCX aquí'}
          </div>
          <div style={{ ...mono, fontSize: 9, opacity: 0.5 }}>
            {file ? `${(file.size / 1024).toFixed(0)} KB` : 'O haz click para seleccionar · máx 10 MB'}
          </div>
        </div>
        <input
          ref={inputRef} type="file" accept=".pdf,.docx"
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Count selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>02 — CANTIDAD</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {COUNT_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                ...mono, fontSize: 13, padding: '12px 28px',
                border: inkBorder, marginRight: -3,
                background: count === n ? C.ink : C.cream,
                color: count === n ? C.cream : C.ink,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Exam type selector */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>03 — TIPO DE EXAMEN</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
          {EXAM_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setTipoExamen(opt)}
              style={{
                ...mono, fontSize: 10, padding: '10px 18px',
                border: inkBorder, marginRight: -3, marginBottom: -3,
                background: tipoExamen === opt ? C.ink : C.cream,
                color: tipoExamen === opt ? C.cream : C.ink,
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          ))}
          <button
            onClick={() => setTipoExamen('OTRO')}
            style={{
              ...mono, fontSize: 10, padding: '10px 18px',
              border: inkBorder, marginRight: -3, marginBottom: -3,
              background: tipoExamen === 'OTRO' ? C.ink : C.cream,
              color: tipoExamen === 'OTRO' ? C.cream : C.ink,
              cursor: 'pointer',
            }}
          >
            OTRO
          </button>
        </div>
        {tipoExamen === 'OTRO' && (
          <input
            type="text"
            placeholder="Nombre del examen..."
            value={customExamen}
            onChange={e => setCustomExamen(e.target.value)}
            style={{
              ...bodyFont, width: '100%', padding: '12px 16px', marginTop: 8,
              border: inkBorder, background: C.cream, color: C.ink,
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !file || !keyConfigured || !effectiveTipoExamen.trim()}
        style={{
          ...disp, fontSize: 15, width: '100%',
          background: (loading || !file || !keyConfigured) ? '#aaa' : C.ink,
          color: C.cream, border: inkBorder, padding: '18px 24px',
          cursor: (loading || !file || !keyConfigured) ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? `GENERANDO ${count} FLASHCARDS...` : `GENERAR ${count} FLASHCARDS →`}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/flashcards/GeneratorForm.tsx
git commit -m "feat: add GeneratorForm component (upload, count, exam type selectors)"
```

---

## Task 12: Main /flashcards Page

**Files:**
- Create: `src/app/(protected)/flashcards/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(protected)/flashcards/page.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { C, mono, disp, bodyFont, inkBorder, kicker } from '@/lib/cm'
import AiFlipCard, { AiFlashcard } from '@/components/flashcards/AiFlipCard'
import ApiKeyModal from '@/components/flashcards/ApiKeyModal'
import GeneratorForm from '@/components/flashcards/GeneratorForm'

type PageState = 'generator' | 'preview' | 'dashboard'

export default function FlashcardsPage() {
  const [pageState, setPageState] = useState<PageState>('generator')
  const [keyConfigured, setKeyConfigured] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)

  // Preview state (not yet saved)
  const [preview, setPreview] = useState<AiFlashcard[]>([])
  const [previewTipoExamen, setPreviewTipoExamen] = useState('')
  const [saving, setSaving] = useState(false)

  // Dashboard state (saved)
  const [savedCards, setSavedCards] = useState<AiFlashcard[]>([])
  const [filterEspecialidad, setFilterEspecialidad] = useState('')
  const [filterTipoExamen, setFilterTipoExamen] = useState('')
  const [loadingCards, setLoadingCards] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Load key status on mount
  useEffect(() => {
    fetch('/api/user/claude-key')
      .then(r => r.json())
      .then(d => setKeyConfigured(d.configured))
      .catch(() => {})
  }, [])

  // Load saved cards whenever entering dashboard or filters change
  const loadSavedCards = useCallback(async () => {
    setLoadingCards(true)
    try {
      const params = new URLSearchParams()
      if (filterEspecialidad) params.set('especialidad', filterEspecialidad)
      if (filterTipoExamen) params.set('tipoExamen', filterTipoExamen)
      const res = await fetch(`/api/flashcards?${params}`)
      const data = await res.json()
      setSavedCards(data.flashcards || [])
    } catch {
      // silent
    } finally {
      setLoadingCards(false)
    }
  }, [filterEspecialidad, filterTipoExamen])

  useEffect(() => {
    if (pageState === 'dashboard') loadSavedCards()
  }, [pageState, loadSavedCards])

  const handleGenerated = (cards: AiFlashcard[], tipoExamen: string) => {
    setPreview(cards)
    setPreviewTipoExamen(tipoExamen)
    setPageState('preview')
  }

  const handleSaveBatch = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards: preview, tipoExamen: previewTipoExamen }),
      })
      if (res.ok) {
        setPreview([])
        setPageState('dashboard')
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleDiscardBatch = () => {
    setPreview([])
    setPageState('generator')
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/flashcards/${id}`, { method: 'DELETE' })
    setSavedCards(prev => prev.filter(c => c.id !== id))
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const params = new URLSearchParams()
      if (filterEspecialidad) params.set('especialidad', filterEspecialidad)
      if (filterTipoExamen) params.set('tipoExamen', filterTipoExamen)
      const res = await fetch(`/api/flashcards/pdf?${params}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'flashcards-mir-prep.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Unique filter values from saved cards
  const especialidades = [...new Set(savedCards.map(c => c.especialidad))].sort()
  const tiposExamen = [...new Set(savedCards.map(c => c.tipoExamen))].sort()

  return (
    <div style={{ ...bodyFont }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', opacity: 0.5, marginBottom: 10 }}>
          FLASHCARDS IA
        </div>
        <h1 style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 5rem)', margin: 0 }}>
          {pageState === 'generator' && 'GENERAR FLASHCARDS'}
          {pageState === 'preview' && `PREVIEW — ${preview.length} TARJETAS`}
          {pageState === 'dashboard' && 'MIS FLASHCARDS'}
        </h1>
        {pageState === 'dashboard' && (
          <button
            onClick={() => setPageState('generator')}
            style={{ ...mono, fontSize: 10, marginTop: 16, background: 'transparent', border: inkBorder, padding: '8px 16px', cursor: 'pointer' }}
          >
            + GENERAR MÁS
          </button>
        )}
      </div>

      {/* GENERATOR STATE */}
      {pageState === 'generator' && (
        <GeneratorForm
          keyConfigured={keyConfigured}
          onOpenKeyModal={() => setShowKeyModal(true)}
          onGenerated={handleGenerated}
        />
      )}

      {/* PREVIEW STATE */}
      {pageState === 'preview' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
            {preview.map((card, i) => (
              <AiFlipCard key={i} card={{ ...card, tipoExamen: previewTipoExamen }} />
            ))}
          </div>

          {/* Batch action bar */}
          <div style={{
            position: 'sticky', bottom: 24,
            display: 'flex', gap: 12, justifyContent: 'center',
            background: C.cream, border: inkBorder, padding: '16px 24px',
            boxShadow: '0 -4px 24px rgba(26,26,24,0.08)',
          }}>
            <button
              onClick={handleSaveBatch}
              disabled={saving}
              style={{
                ...mono, fontSize: 11, letterSpacing: '0.08em',
                background: C.ink, color: C.cream, border: inkBorder,
                padding: '12px 28px', cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'GUARDANDO...' : `✓ GUARDAR ESTAS ${preview.length} FLASHCARDS`}
            </button>
            <button
              onClick={handleDiscardBatch}
              style={{
                ...mono, fontSize: 11, letterSpacing: '0.08em',
                background: 'transparent', color: C.ink, border: inkBorder,
                padding: '12px 28px', cursor: 'pointer',
              }}
            >
              ✗ ELIMINAR ESTAS FLASHCARDS
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD STATE */}
      {pageState === 'dashboard' && (
        <div>
          {/* Filter bar + PDF download */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 32 }}>
            <select
              value={filterEspecialidad}
              onChange={e => setFilterEspecialidad(e.target.value)}
              style={{ ...mono, fontSize: 10, padding: '8px 14px', border: inkBorder, background: C.cream, cursor: 'pointer' }}
            >
              <option value="">TODAS LAS ESPECIALIDADES</option>
              {especialidades.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
            </select>
            <select
              value={filterTipoExamen}
              onChange={e => setFilterTipoExamen(e.target.value)}
              style={{ ...mono, fontSize: 10, padding: '8px 14px', border: inkBorder, background: C.cream, cursor: 'pointer' }}
            >
              <option value="">TODOS LOS EXÁMENES</option>
              {tiposExamen.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || savedCards.length === 0}
              style={{
                ...mono, fontSize: 10, letterSpacing: '0.08em',
                background: savedCards.length === 0 ? '#ccc' : C.ink,
                color: C.cream, border: inkBorder,
                padding: '8px 20px', cursor: savedCards.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {downloadingPdf ? 'GENERANDO PDF...' : '↓ DESCARGAR PDF'}
            </button>
            {(filterEspecialidad || filterTipoExamen) && (
              <button
                onClick={() => { setFilterEspecialidad(''); setFilterTipoExamen('') }}
                style={{ ...mono, fontSize: 9, background: 'transparent', border: inkBorder, padding: '8px 14px', cursor: 'pointer', opacity: 0.6 }}
              >
                LIMPIAR FILTROS
              </button>
            )}
          </div>

          {/* Cards grid */}
          {loadingCards ? (
            <div style={{ ...mono, fontSize: 12, opacity: 0.5 }}>CARGANDO...</div>
          ) : savedCards.length === 0 ? (
            <div style={{ ...bodyFont, opacity: 0.5, fontSize: 16 }}>
              No hay flashcards guardadas{filterEspecialidad || filterTipoExamen ? ' con estos filtros' : ''}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {savedCards.map(card => (
                <AiFlipCard key={card.id} card={card} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <ApiKeyModal
          onClose={() => setShowKeyModal(false)}
          onSaved={() => {
            setKeyConfigured(true)
            setShowKeyModal(false)
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Compile check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Run dev and manually test the full flow**

```bash
npm run dev
```

Open `http://localhost:3000/flashcards`. Verify:
- [ ] "✦ FLASHCARDS IA" appears in NavBar and is active on this route
- [ ] API key status indicator shows "NO CONFIGURADA"
- [ ] Clicking "CONFIGURAR →" opens the modal
- [ ] After saving a valid `sk-ant-...` key the status changes to "CONFIGURADA"
- [ ] File dropzone accepts PDF and DOCX
- [ ] Count pill buttons (10/20/30) work
- [ ] Exam type buttons including "OTRO" with custom text work
- [ ] Upload a real PDF and click "GENERAR" → shows loading state → preview grid appears
- [ ] Cards flip on click showing front (cream) and back (dark) with readable text
- [ ] "GUARDAR ESTAS N FLASHCARDS" saves → redirects to dashboard
- [ ] Dashboard shows saved cards with flip interaction
- [ ] Delete button (ELIMINAR) removes the card
- [ ] Filters by especialidad and tipoExamen work
- [ ] "DESCARGAR PDF" downloads a PDF file
- [ ] Clicking "✗ ELIMINAR ESTAS FLASHCARDS" in preview discards and returns to generator

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/flashcards/page.tsx
git commit -m "feat: add /flashcards page (generator → preview → dashboard states)"
```

---

## Task 13: Deploy to Production

- [ ] **Step 1: Final compile check**

```bash
npx tsc --noEmit
npm run build
```

Fix any build errors before continuing.

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel deploy --prod
```

- [ ] **Step 3: Smoke test in production**

Open `https://mir-prep.vercel.app/flashcards`. Verify:
- [ ] NavBar shows FLASHCARDS IA
- [ ] API key modal opens and saves successfully
- [ ] PDF/DOCX upload and generation works
- [ ] PDF download produces a valid file

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: production adjustments for flashcards feature"
```
