import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { cancelarSuscripcion } from '@/lib/mercadopago'

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

  if (!dbUser.mpSuscripcionId) {
    return NextResponse.json({ error: 'No tienes una suscripción para cancelar' }, { status: 400 })
  }

  try {
    await cancelarSuscripcion(dbUser.mpSuscripcionId)

    // Mantenemos el acceso hasta el fin del periodo pagado: no tocamos
    // suscripcionExpira, solo marcamos el estado como cancelado.
    await prisma.usuario.update({
      where: { id: dbUser.id },
      data: {
        suscripcionStatus: 'cancelled',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error cancelling MP subscription:', e)
    return NextResponse.json({ error: 'Error al cancelar suscripción' }, { status: 500 })
  }
}
