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

  // Red de seguridad: re-guardamos (upsert) las respuestas recibidas por si alguna
  // no se persistió en vivo. Idempotente gracias a @@unique([sesion_id, pregunta_id]).
  for (const r of respuestas as any[]) {
    await prisma.respuesta.upsert({
      where: { sesion_id_pregunta_id: { sesion_id, pregunta_id: r.pregunta_id } },
      update: { respuesta: r.respuesta, correcta: r.correcta, tiempo_ms: r.tiempo_ms ?? null },
      create: {
        user_id: user.id,
        sesion_id,
        pregunta_id: r.pregunta_id,
        respuesta: r.respuesta,
        correcta: r.correcta,
        tiempo_ms: r.tiempo_ms ?? null,
      },
    })
  }

  // Recalculamos SIEMPRE desde la BD (fuente de verdad), no desde el request.
  const guardadas = await prisma.respuesta.findMany({
    where: { sesion_id },
    select: { correcta: true, tiempo_ms: true, pregunta: { select: { especialidad: true, tema: true } } },
  })

  const correctas = guardadas.filter((r) => r.correcta).length
  const total = guardadas.length
  // Tiempo total dedicado al simulacro = suma del tiempo por respuesta.
  const tiempoTotalMs = guardadas.reduce((s, r) => s + (r.tiempo_ms ?? 0), 0)

  const yaCompletada = sesion.completada

  // Update session
  await prisma.sesion.update({
    where: { id: sesion_id },
    data: { score: correctas, completada: true, ultima_actividad: new Date() },
  })

  // El progreso (dominio del alumno) solo se actualiza la PRIMERA vez que se completa,
  // para evitar doble conteo si completar() se llama de nuevo (p. ej. al reanudar).
  if (!yaCompletada) {
    const progresoUpdates = new Map<string, { especialidad: string; tema: string; total: number; correctas: number }>()

    for (const r of guardadas) {
      if (!r.pregunta) continue
      const espNorm = normalizeEspecialidad(r.pregunta.especialidad)
      const key = `${espNorm}::${r.pregunta.tema}`
      const existing = progresoUpdates.get(key) || {
        especialidad: espNorm,
        tema: r.pregunta.tema,
        total: 0,
        correctas: 0,
      }
      existing.total++
      if (r.correcta) existing.correctas++
      progresoUpdates.set(key, existing)
    }

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
  }

  return NextResponse.json({
    score: correctas,
    total,
    porcentaje: total > 0 ? Math.round((correctas / total) * 100) : 0,
    tiempoTotalMs,
  })
}
