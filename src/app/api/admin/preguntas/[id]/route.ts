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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  const pregunta = await prisma.pregunta.findUnique({ where: { id } })
  if (!pregunta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  return NextResponse.json(pregunta)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { numero_mir, enunciado, opciones, respuesta_correcta, imagen_url, video_url, especialidad, tema, subtema, dificultad } = body

  const pregunta = await prisma.pregunta.update({
    where: { id },
    data: {
      numero_mir: parseInt(numero_mir),
      enunciado,
      opciones,
      respuesta_correcta,
      imagen_url: imagen_url || null,
      video_url: video_url || null,
      especialidad,
      tema,
      subtema: subtema || null,
      dificultad: dificultad || 'media',
    },
  })

  return NextResponse.json(pregunta)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  await prisma.pregunta.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
