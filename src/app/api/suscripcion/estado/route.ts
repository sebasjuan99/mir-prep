import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { obtenerSuscripcion } from '@/lib/mercadopago'
import { enlazarSuscripcionMP } from '@/lib/suscripcion-link'

const VIGENTES = new Set(['authorized', 'pending', 'paused'])

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const dbUser = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
    select: {
      id: true,
      email: true,
      suscripcionStatus: true,
      suscripcionExpira: true,
      mpSuscripcionId: true,
    },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Auto-rescate: si la suscripción está vigente pero NO tenemos guardado el
  // mpSuscripcionId (el enlace por back_url pudo fallar durante la prueba), lo
  // buscamos en MP y lo enlazamos ahora. Así el botón de cancelar funcionará.
  let mpSuscripcionId = dbUser.mpSuscripcionId
  if (!mpSuscripcionId && VIGENTES.has(dbUser.suscripcionStatus)) {
    try {
      const enlazada = await enlazarSuscripcionMP({
        id: dbUser.id,
        email: dbUser.email,
        mpSuscripcionId: null,
      })
      if (enlazada) mpSuscripcionId = enlazada.id
    } catch (e) {
      console.error('estado: auto-enlace MP falló', e)
    }
  }

  // If user has an MP subscription, sync status from MP
  if (mpSuscripcionId && dbUser.suscripcionStatus !== 'authorized') {
    try {
      const mp = await obtenerSuscripcion(mpSuscripcionId)
      if (mp.status !== dbUser.suscripcionStatus) {
        await prisma.usuario.update({
          where: { auth_id: user.id },
          data: {
            suscripcionStatus: mp.status,
            // Conservamos la fecha existente si MP no envía una nueva (tras cancelar).
            ...(mp.next_payment_date ? { suscripcionExpira: new Date(mp.next_payment_date) } : {}),
          },
        })
        return NextResponse.json({
          status: mp.status,
          expira: mp.next_payment_date ?? dbUser.suscripcionExpira,
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
