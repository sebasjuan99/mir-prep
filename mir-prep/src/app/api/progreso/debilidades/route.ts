import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const progreso = await prisma.progreso.findMany({
    where: { user_id: user.id, total: { gte: 2 } },
  })

  const debilidades = progreso
    .map(p => ({
      especialidad: p.especialidad,
      tema: p.tema,
      total: p.total,
      correctas: p.correctas,
      porcentaje: Math.round((p.correctas / p.total) * 100),
    }))
    .filter(p => p.porcentaje < 60)
    .sort((a, b) => a.porcentaje - b.porcentaje)
    .slice(0, 10)

  return NextResponse.json(debilidades)
}
