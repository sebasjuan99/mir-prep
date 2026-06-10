import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const historial = await prisma.sesion.findMany({
    where: { user_id: user.id, completada: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      tipo: true,
      filtro: true,
      universidad: true,
      score: true,
      total: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ historial })
}
