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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const especialidad = searchParams.get('especialidad') || ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { enunciado: { contains: search, mode: 'insensitive' } },
      { tema: { contains: search, mode: 'insensitive' } },
    ]
    const searchNum = parseInt(search)
    if (!isNaN(searchNum)) {
      (where.OR as unknown[]).push({ numero_mir: searchNum })
    }
  }
  if (especialidad) {
    where.especialidad = especialidad
  }

  const [preguntas, total] = await Promise.all([
    prisma.pregunta.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { numero_mir: 'desc' },
      include: { tipoExamen: { select: { codigo: true, nombre: true } } },
    }),
    prisma.pregunta.count({ where }),
  ])

  return NextResponse.json({
    preguntas,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { numero_mir, enunciado, opciones, respuesta_correcta, imagen_url, video_url, especialidad, tema, subtema, dificultad, tipoExamen_id } = body

  if (!numero_mir || !enunciado || !opciones || !respuesta_correcta || !especialidad || !tema) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Puente: si se asigna un tipo de examen, copiamos su nombre al campo legacy `universidad`
  // para que el simulacro "por universidad" del usuario lo siga encontrando.
  let universidad: string | null = null
  if (tipoExamen_id) {
    const tipo = await prisma.tipoExamen.findUnique({ where: { id: tipoExamen_id } })
    if (!tipo) return NextResponse.json({ error: 'Tipo de examen no encontrado' }, { status: 400 })
    universidad = tipo.nombre
  }

  const pregunta = await prisma.pregunta.create({
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
      tipoExamen_id: tipoExamen_id || null,
      universidad,
    },
  })

  return NextResponse.json(pregunta, { status: 201 })
}
