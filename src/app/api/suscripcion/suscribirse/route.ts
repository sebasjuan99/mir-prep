import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { crearCheckoutSuscripcion } from '@/lib/mercadopago'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const dbUser = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (dbUser.suscripcionStatus === 'authorized') {
    return NextResponse.json({ error: 'Ya tienes una suscripción activa' }, { status: 400 })
  }

  try {
    // El checkout del plan (con 7 días de prueba gratis) recoge la tarjeta en MP.
    // La suscripción se vincula al usuario por external_reference vía webhook.
    const initPoint = crearCheckoutSuscripcion(dbUser.id)

    await prisma.usuario.update({
      where: { id: dbUser.id },
      data: {
        suscripcionStatus: 'pending',
      },
    })

    return NextResponse.json({ init_point: initPoint })
  } catch (e) {
    console.error('Error creating MP subscription:', e)
    return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 })
  }
}
