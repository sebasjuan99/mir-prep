import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Devuelve el simulacro en curso (no completado) más reciente del usuario, con sus
// preguntas en orden y las respuestas ya dadas, para poder reanudarlo donde quedó.
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sesion = await prisma.sesion.findFirst({
    where: { user_id: user.id, completada: false },
    orderBy: { ultima_actividad: 'desc' },
  })

  // Solo reanudable si guardó el orden de preguntas (sesiones nuevas con Bloque 1.5).
  if (!sesion || !sesion.preguntas_orden || sesion.preguntas_orden.length === 0) {
    return NextResponse.json({ sesion: null })
  }

  const preguntasRaw = await prisma.pregunta.findMany({
    where: { id: { in: sesion.preguntas_orden } },
  })
  const byId = new Map(preguntasRaw.map((p) => [p.id, p]))
  // Reordenar según preguntas_orden y descartar ids que ya no existan.
  const preguntas = sesion.preguntas_orden.map((id) => byId.get(id)).filter(Boolean)

  const respuestas = await prisma.respuesta.findMany({
    where: { sesion_id: sesion.id },
    select: { pregunta_id: true, respuesta: true, correcta: true, tiempo_ms: true },
  })

  return NextResponse.json({
    sesion: {
      sesion_id: sesion.id,
      tipo: sesion.tipo,
      universidad: sesion.universidad,
      total: sesion.total,
      respondidas: respuestas.length,
    },
    preguntas,
    respuestas: respuestas.map((r) => ({
      pregunta_id: r.pregunta_id,
      respuesta: r.respuesta,
      correcta: r.correcta,
      tiempo_ms: r.tiempo_ms ?? 0,
    })),
  })
}
