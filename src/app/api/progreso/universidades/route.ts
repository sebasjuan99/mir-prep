import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const stats = await prisma.$queryRaw<Array<{
    universidad: string
    total: bigint
    correctas: bigint
  }>>`
    SELECT p.universidad,
           COUNT(r.id) AS total,
           SUM(CASE WHEN r.correcta THEN 1 ELSE 0 END) AS correctas
    FROM "Respuesta" r
    JOIN "Pregunta" p ON r.pregunta_id = p.id
    WHERE r.user_id = ${user.id}
      AND p.universidad IS NOT NULL
    GROUP BY p.universidad
    ORDER BY COUNT(r.id) DESC
  `

  const result = stats.map(s => ({
    universidad: s.universidad,
    total: Number(s.total),
    correctas: Number(s.correctas),
    porcentaje: Number(s.total) > 0
      ? Math.round((Number(s.correctas) / Number(s.total)) * 100)
      : 0,
  }))

  return NextResponse.json(result)
}
