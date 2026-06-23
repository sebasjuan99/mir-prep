import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.usuario.findUnique({ where: { auth_id: user.id } })
  if (!dbUser || dbUser.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const [
    totalPreguntas,
    totalUsuarios,
    sesionesCompletadas,
    sesionesIniciadas,
    totalRespuestas,
    respuestasCompletadas,
  ] = await Promise.all([
    prisma.pregunta.count(),
    prisma.usuario.count(),
    prisma.sesion.count({ where: { completada: true } }),
    prisma.sesion.count(),
    prisma.respuesta.count(),
    prisma.respuesta.count({ where: { sesion: { completada: true } } }),
  ])

  // Specialty stats: group respuestas by specialty
  const especialidadStats = await prisma.$queryRaw<
    { especialidad: string; total: bigint; correctas: bigint }[]
  >`
    SELECT p.especialidad,
           COUNT(r.id)::bigint as total,
           SUM(CASE WHEN r.correcta THEN 1 ELSE 0 END)::bigint as correctas
    FROM "Respuesta" r
    JOIN "Pregunta" p ON r."pregunta_id" = p.id
    GROUP BY p.especialidad
    ORDER BY p.especialidad
  `

  const especialidades = especialidadStats.map((e) => ({
    especialidad: e.especialidad,
    total: Number(e.total),
    correctas: Number(e.correctas),
    porcentaje: Number(e.total) > 0
      ? Math.round((Number(e.correctas) / Number(e.total)) * 100)
      : 0,
  }))

  // Recent sessions
  const recentSessions = await prisma.sesion.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      user_id: true,
      tipo: true,
      filtro: true,
      score: true,
      total: true,
      completada: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    totalPreguntas,
    totalUsuarios,
    sesionesCompletadas,
    sesionesIniciadas,
    totalRespuestas,
    respuestasCompletadas,
    especialidades,
    recentSessions,
  })
}
