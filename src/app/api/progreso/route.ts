import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeEspecialidad } from '@/lib/constants'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const progreso = await prisma.progreso.findMany({
    where: { user_id: user.id },
  })

  const porEspecialidad = new Map<string, { total: number; correctas: number }>()
  let totalGlobal = 0
  let correctasGlobal = 0

  for (const p of progreso) {
    totalGlobal += p.total
    correctasGlobal += p.correctas
    const canonical = normalizeEspecialidad(p.especialidad)
    const existing = porEspecialidad.get(canonical) || { total: 0, correctas: 0 }
    existing.total += p.total
    existing.correctas += p.correctas
    porEspecialidad.set(canonical, existing)
  }

  const porEspecialidadArray = Array.from(porEspecialidad.entries()).map(([especialidad, data]) => ({
    especialidad,
    total: data.total,
    correctas: data.correctas,
    porcentaje: data.total > 0 ? Math.round((data.correctas / data.total) * 100) : 0,
  })).sort((a, b) => b.total - a.total)

  return NextResponse.json({
    total: totalGlobal,
    correctas: correctasGlobal,
    porcentaje: totalGlobal > 0 ? Math.round((correctasGlobal / totalGlobal) * 100) : 0,
    porEspecialidad: porEspecialidadArray,
  })
}
