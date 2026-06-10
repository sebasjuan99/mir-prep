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
