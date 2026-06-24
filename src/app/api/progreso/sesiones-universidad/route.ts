import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Número de sesiones (simulacros) por tipo de examen / universidad del usuario.
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rows = await prisma.sesion.groupBy({
    by: ['universidad'],
    where: { user_id: user.id, universidad: { not: null } },
    _count: { _all: true },
  })

  const result = rows
    .map((r) => ({ universidad: r.universidad as string, sesiones: r._count._all }))
    .sort((a, b) => b.sesiones - a.sesiones)

  return NextResponse.json(result)
}
