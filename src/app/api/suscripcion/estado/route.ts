import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { obtenerSuscripcion } from '@/lib/mercadopago'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const dbUser = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
    select: {
      suscripcionStatus: true,
      suscripcionExpira: true,
      mpSuscripcionId: true,
    },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // If user has an MP subscription, sync status from MP
  if (dbUser.mpSuscripcionId && dbUser.suscripcionStatus !== 'authorized') {
    try {
      const mp = await obtenerSuscripcion(dbUser.mpSuscripcionId)
      if (mp.status !== dbUser.suscripcionStatus) {
        await prisma.usuario.update({
          where: { auth_id: user.id },
          data: {
            suscripcionStatus: mp.status,
            suscripcionExpira: mp.next_payment_date ? new Date(mp.next_payment_date) : null,
          },
        })
        return NextResponse.json({
          status: mp.status,
          expira: mp.next_payment_date,
        })
      }
    } catch {
      // If MP API fails, return cached status
    }
  }

  return NextResponse.json({
    status: dbUser.suscripcionStatus,
    expira: dbUser.suscripcionExpira,
  })
}
