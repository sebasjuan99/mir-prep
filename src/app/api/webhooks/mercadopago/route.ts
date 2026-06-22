import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { obtenerSuscripcion } from '@/lib/mercadopago'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // MP sends different notification types
    // For subscriptions: type = "subscription_preapproval"
    if (body.type === 'subscription_preapproval' && body.data?.id) {
      const suscripcionId = body.data.id as string

      const mp = await obtenerSuscripcion(suscripcionId)

      // Map MP status to our status
      // MP statuses: pending, authorized, paused, cancelled
      const statusMap: Record<string, string> = {
        pending: 'pending',
        authorized: 'authorized',
        paused: 'paused',
        cancelled: 'cancelled',
      }

      const newStatus = statusMap[mp.status] || mp.status

      // Find user by MP subscription ID or external_reference (our user ID)
      const user = await prisma.usuario.findFirst({
        where: {
          OR: [
            { mpSuscripcionId: suscripcionId },
            { id: mp.external_reference },
          ],
        },
      })

      if (user) {
        await prisma.usuario.update({
          where: { id: user.id },
          data: {
            mpSuscripcionId: suscripcionId,
            suscripcionStatus: newStatus,
            suscripcionExpira: mp.next_payment_date ? new Date(mp.next_payment_date) : null,
          },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook MP error:', e)
    return NextResponse.json({ ok: true })
  }
}
