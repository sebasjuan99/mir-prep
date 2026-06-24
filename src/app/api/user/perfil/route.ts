import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const u = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
    select: {
      nombre: true, apellido: true, telefono: true, profesion: true,
      especialidadAplica: true, email: true, onboardingCompletado: true,
    },
  })
  if (!u) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json(u)
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const data: Record<string, unknown> = {}
  for (const campo of ['nombre', 'apellido', 'telefono', 'profesion', 'especialidadAplica'] as const) {
    if (typeof body[campo] === 'string') data[campo] = body[campo].trim() || null
  }
  // Marcar onboarding como completado (no se puede volver a false desde aquí).
  if (body.completarOnboarding === true) data.onboardingCompletado = true

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const u = await prisma.usuario.update({
    where: { auth_id: user.id },
    data,
    select: {
      nombre: true, apellido: true, telefono: true, profesion: true,
      especialidadAplica: true, email: true, onboardingCompletado: true,
    },
  })

  return NextResponse.json(u)
}
