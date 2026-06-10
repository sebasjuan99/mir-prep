import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { encryptApiKey } from '@/lib/crypto'

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

  let body: { apiKey?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }
  const apiKey = body.apiKey

  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'API key inválida. Debe comenzar con sk-ant-' }, { status: 400 })
  }

  let encrypted: string
  try {
    encrypted = encryptApiKey(apiKey)
  } catch (err) {
    console.error('[claude-key POST] encryptApiKey failed:', err)
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  try {
    await prisma.usuario.upsert({
      where: { auth_id: user.id },
      update: { claudeApiKeyEnc: encrypted },
      create: {
        auth_id: user.id,
        email: user.email ?? '',
        claudeApiKeyEnc: encrypted,
      },
    })
  } catch (err) {
    console.error('[claude-key POST] prisma upsert failed:', err)
    return NextResponse.json({ error: 'Error al guardar en base de datos' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
