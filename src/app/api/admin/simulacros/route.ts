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

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const simulacros = await prisma.sesion.findMany({
    where: { tipo: 'personalizado' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ simulacros })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { nombre, pregunta_ids } = body as { nombre: string; pregunta_ids: string[] }

  if (!nombre || !pregunta_ids || pregunta_ids.length === 0) {
    return NextResponse.json({ error: 'Nombre y preguntas son obligatorios' }, { status: 400 })
  }

  const simulacro = await prisma.sesion.create({
    data: {
      user_id: admin.auth_id,
      tipo: 'personalizado',
      filtro: JSON.stringify({ nombre, pregunta_ids }),
      total: pregunta_ids.length,
    },
  })

  return NextResponse.json(simulacro, { status: 201 })
}
