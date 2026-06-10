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
