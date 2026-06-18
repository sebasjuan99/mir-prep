import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeEspecialidad } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { sesion_id, respuestas } = body

  if (!sesion_id || !respuestas?.length) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Verify session belongs to user
  const sesion = await prisma.sesion.findFirst({
    where: { id: sesion_id, user_id: user.id },
  })
  if (!sesion) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })

  // Save all answers
  await prisma.respuesta.createMany({
    data: respuestas.map((r: any) => ({
      user_id: user.id,
      sesion_id,
      pregunta_id: r.pregunta_id,
      respuesta: r.respuesta,
      correcta: r.correcta,
      tiempo_ms: r.tiempo_ms || null,
    })),
  })

  // Calculate score
  const correctas = respuestas.filter((r: any) => r.correcta).length
  const total = respuestas.length

  // Update session
  await prisma.sesion.update({
    where: { id: sesion_id },
    data: { score: correctas, completada: true },
  })

  // Update progress per specialty/topic
  // Get all questions for this session to know specialty/topic
  const preguntaIds = respuestas.map((r: any) => r.pregunta_id)
  const preguntas = await prisma.pregunta.findMany({
    where: { id: { in: preguntaIds } },
    select: { id: true, especialidad: true, tema: true },
  })

  const preguntaMap = new Map(preguntas.map(p => [p.id, p]))

  // Group by especialidad+tema
  const progresoUpdates = new Map<string, { especialidad: string; tema: string; total: number; correctas: number }>()

  for (const r of respuestas) {
    const pregunta = preguntaMap.get(r.pregunta_id)
    if (!pregunta) continue
    const espNorm = normalizeEspecialidad(pregunta.especialidad)
    const key = `${espNorm}::${pregunta.tema}`
    const existing = progresoUpdates.get(key) || {
      especialidad: espNorm,
      tema: pregunta.tema,
      total: 0,
      correctas: 0,
    }
    existing.total++
    if (r.correcta) existing.correctas++
    progresoUpdates.set(key, existing)
  }

  // Upsert progress records
  for (const [, update] of progresoUpdates) {
    await prisma.progreso.upsert({
      where: {
        user_id_especialidad_tema: {
          user_id: user.id,
          especialidad: update.especialidad,
          tema: update.tema,
        },
      },
      update: {
        total: { increment: update.total },
        correctas: { increment: update.correctas },
        ultima_sesion: new Date(),
      },
      create: {
        user_id: user.id,
        especialidad: update.especialidad,
        tema: update.tema,
        total: update.total,
        correctas: update.correctas,
        ultima_sesion: new Date(),
      },
    })
  }

  return NextResponse.json({
    score: correctas,
    total,
    porcentaje: Math.round((correctas / total) * 100),
  })
}
