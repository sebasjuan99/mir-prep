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
