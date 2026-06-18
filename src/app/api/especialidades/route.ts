import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeEspecialidad } from '@/lib/constants'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const rawEspecialidades = await prisma.pregunta.groupBy({
    by: ['especialidad'],
    _count: { id: true },
  })

  const aggregated = new Map<string, number>()
  for (const r of rawEspecialidades) {
    const canonical = normalizeEspecialidad(r.especialidad)
    aggregated.set(canonical, (aggregated.get(canonical) || 0) + r._count.id)
  }

  let progresoMap = new Map<string, { total: number; correctas: number }>()

  if (user) {
    const progreso = await prisma.progreso.findMany({
      where: { user_id: user.id },
    })
    for (const p of progreso) {
      const canonical = normalizeEspecialidad(p.especialidad)
      const existing = progresoMap.get(canonical) || { total: 0, correctas: 0 }
      existing.total += p.total
      existing.correctas += p.correctas
      progresoMap.set(canonical, existing)
    }
  }

  const result = Array.from(aggregated.entries())
    .map(([nombre, totalPreguntas]) => {
      const prog = progresoMap.get(nombre)
      return {
        nombre,
        totalPreguntas,
        respondidas: prog?.total || 0,
        correctas: prog?.correctas || 0,
        porcentaje: prog && prog.total > 0 ? Math.round((prog.correctas / prog.total) * 100) : null,
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return NextResponse.json(result)
}
