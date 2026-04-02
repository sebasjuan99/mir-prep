import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') || 'aleatorio'
  const especialidad = searchParams.get('especialidad')

  let preguntas

  if (tipo === 'repaso_errores') {
    // Get questions the user got wrong
    const wrongAnswers = await prisma.respuesta.findMany({
      where: { user_id: user.id, correcta: false },
      select: { pregunta_id: true },
      distinct: ['pregunta_id'],
    })
    const wrongIds = wrongAnswers.map(r => r.pregunta_id)

    if (wrongIds.length === 0) {
      return NextResponse.json({ error: 'No tienes errores previos' }, { status: 404 })
    }

    preguntas = await prisma.pregunta.findMany({
      where: { id: { in: wrongIds } },
      take: 20,
      orderBy: { numero_mir: 'asc' },
    })
  } else if (especialidad) {
    preguntas = await prisma.$queryRaw`
      SELECT * FROM "Pregunta" WHERE especialidad = ${especialidad} ORDER BY RANDOM() LIMIT 20
    `
  } else {
    preguntas = await prisma.$queryRaw`
      SELECT * FROM "Pregunta" ORDER BY RANDOM() LIMIT 20
    `
  }

  // Create session
  const sesion = await prisma.sesion.create({
    data: {
      user_id: user.id,
      tipo,
      filtro: especialidad,
      total: Array.isArray(preguntas) ? preguntas.length : 20,
    },
  })

  return NextResponse.json({ sesion_id: sesion.id, preguntas })
}
