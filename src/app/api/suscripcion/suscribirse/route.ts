import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { crearSuscripcion } from '@/lib/mercadopago'

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
    const mp = await crearSuscripcion(dbUser.email, dbUser.id)

    await prisma.usuario.update({
      where: { id: dbUser.id },
      data: {
        mpSuscripcionId: mp.id,
        suscripcionStatus: 'pending',
      },
    })

    return NextResponse.json({ init_point: mp.init_point })
  } catch (e) {
    console.error('Error creating MP subscription:', e)
    return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 })
  }
}
