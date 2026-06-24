import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeEspecialidad } from '@/lib/constants'

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

  // Specialty stats: agrupamos por especialidad CRUDA en SQL y luego unificamos las
  // variantes con normalizeEspecialidad() (mismo criterio que el resto de la app, p. ej.
  // progreso/route.ts). Así "Cardiologia"/"Cardiología", "Ortopedia"/"Traumatología y
  // Ortopedia", etc. colapsan en una sola especialidad canónica y el % deja de ser engañoso.
  const especialidadStats = await prisma.$queryRaw<
    { especialidad: string; total: bigint; correctas: bigint }[]
  >`
    SELECT p.especialidad,
           COUNT(r.id)::bigint as total,
           SUM(CASE WHEN r.correcta THEN 1 ELSE 0 END)::bigint as correctas
    FROM "Respuesta" r
    JOIN "Pregunta" p ON r."pregunta_id" = p.id
    GROUP BY p.especialidad
  `

  const porEspecialidad = new Map<string, { total: number; correctas: number }>()
  for (const e of especialidadStats) {
    const canonical = normalizeEspecialidad(e.especialidad)
    const acc = porEspecialidad.get(canonical) || { total: 0, correctas: 0 }
    acc.total += Number(e.total)
    acc.correctas += Number(e.correctas)
    porEspecialidad.set(canonical, acc)
  }

  const especialidades = Array.from(porEspecialidad.entries())
    .map(([especialidad, d]) => ({
      especialidad,
      total: d.total,
      correctas: d.correctas,
      porcentaje: d.total > 0 ? Math.round((d.correctas / d.total) * 100) : 0,
    }))
    .sort((a, b) => a.especialidad.localeCompare(b.especialidad))

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
