import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeEspecialidad } from '@/lib/constants'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const progreso = await prisma.progreso.findMany({
    where: { user_id: user.id, total: { gte: 2 } },
  })

  const aggregated = new Map<string, { tema: string; especialidad: string; total: number; correctas: number }>()
  for (const p of progreso) {
    const canonical = normalizeEspecialidad(p.especialidad)
    const key = `${canonical}::${p.tema}`
    const existing = aggregated.get(key) || { especialidad: canonical, tema: p.tema, total: 0, correctas: 0 }
    existing.total += p.total
    existing.correctas += p.correctas
    aggregated.set(key, existing)
  }

  const debilidades = Array.from(aggregated.values())
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
