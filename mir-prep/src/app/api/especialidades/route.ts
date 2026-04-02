import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all specialties from questions
  const especialidades = await prisma.pregunta.groupBy({
    by: ['especialidad'],
    _count: { id: true },
    orderBy: { especialidad: 'asc' },
  })

  let progresoMap = new Map<string, { total: number; correctas: number }>()

  if (user) {
    const progreso = await prisma.progreso.findMany({
      where: { user_id: user.id },
    })
    for (const p of progreso) {
      const existing = progresoMap.get(p.especialidad) || { total: 0, correctas: 0 }
      existing.total += p.total
      existing.correctas += p.correctas
      progresoMap.set(p.especialidad, existing)
    }
  }

  const result = especialidades.map(e => {
    const prog = progresoMap.get(e.especialidad)
    return {
      nombre: e.especialidad,
      totalPreguntas: e._count.id,
      respondidas: prog?.total || 0,
      correctas: prog?.correctas || 0,
      porcentaje: prog && prog.total > 0 ? Math.round((prog.correctas / prog.total) * 100) : null,
    }
  })

  return NextResponse.json(result)
}
