import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.usuario.findUnique({ where: { auth_id: user.id } })
  if (!dbUser || dbUser.role !== 'admin') return null
  return dbUser
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (typeof body.activo === 'boolean') data.activo = body.activo
  if (body.role && ['admin', 'user'].includes(body.role)) data.role = body.role

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
  })

  return NextResponse.json(usuario)
}
