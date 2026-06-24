import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeEspecialidad } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') || 'aleatorio'
  const especialidad = searchParams.get('especialidad')
  const universidad = searchParams.get('universidad')
  // Simulacro completo por universidad: 100 preguntas (o las que haya disponibles).
  const esCompleto = tipo === 'completo'

  let preguntas

  if (tipo === 'repaso_errores') {
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
      orderBy: { createdAt: 'asc' },
    })
  } else if (universidad) {
    const limite = esCompleto ? 100 : 20
    preguntas = await prisma.$queryRaw`
      SELECT * FROM "Pregunta" WHERE universidad = ${universidad} ORDER BY RANDOM() LIMIT ${limite}
    `
  } else if (especialidad) {
    const allRaw = await prisma.pregunta.groupBy({ by: ['especialidad'] })
    const matching = allRaw
      .map(r => r.especialidad)
      .filter(e => normalizeEspecialidad(e) === especialidad)

    if (matching.length === 0) {
      return NextResponse.json({ error: 'Especialidad no encontrada' }, { status: 404 })
    }

    preguntas = await prisma.pregunta.findMany({
      where: { especialidad: { in: matching } },
    })
    // Shuffle and take 20
    const shuffled = (preguntas as any[]).sort(() => Math.random() - 0.5).slice(0, 20)
    preguntas = shuffled
  } else {
    preguntas = await prisma.$queryRaw`
      SELECT * FROM "Pregunta" ORDER BY RANDOM() LIMIT 20
    `
  }

  const preguntaIds = Array.isArray(preguntas) ? (preguntas as { id: string }[]).map((p) => p.id) : []

  const sesion = await prisma.sesion.create({
    data: {
      user_id: user.id,
      // 'completo' = simulacro completo por universidad; si no, mantiene el comportamiento previo.
      tipo: esCompleto ? 'completo' : (universidad ? 'universidad' : tipo),
      filtro: especialidad,
      universidad,
      total: preguntaIds.length || (esCompleto ? 100 : 20),
      preguntas_orden: preguntaIds,
      ultima_actividad: new Date(),
    },
  })

  return NextResponse.json({ sesion_id: sesion.id, preguntas })
}
