import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Guarda (o actualiza) UNA respuesta en el momento en que el usuario la marca.
// Idempotente gracias a @@unique([sesion_id, pregunta_id]): reanudar o cambiar
// la respuesta no crea filas duplicadas.
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { sesion_id, pregunta_id, respuesta, tiempo_ms } = body

  if (!sesion_id || !pregunta_id || respuesta == null) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // La sesión debe pertenecer al usuario
  const sesion = await prisma.sesion.findFirst({
    where: { id: sesion_id, user_id: user.id },
    select: { id: true },
  })
  if (!sesion) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })

  // La corrección se calcula en el servidor comparando la letra elegida con la
  // respuesta correcta almacenada; nunca se confía en un flag enviado por el cliente.
  const pregunta = await prisma.pregunta.findUnique({
    where: { id: pregunta_id },
    select: { respuesta_correcta: true },
  })
  if (!pregunta) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })
  const correcta = pregunta.respuesta_correcta === respuesta

  await prisma.respuesta.upsert({
    where: { sesion_id_pregunta_id: { sesion_id, pregunta_id } },
    update: { respuesta, correcta, tiempo_ms: tiempo_ms ?? null },
    create: {
      user_id: user.id,
      sesion_id,
      pregunta_id,
      respuesta,
      correcta,
      tiempo_ms: tiempo_ms ?? null,
    },
  })

  await prisma.sesion.update({
    where: { id: sesion_id },
    data: { ultima_actividad: new Date() },
  })

  return NextResponse.json({ ok: true })
}
