import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { obtenerSuscripcion } from '@/lib/mercadopago'

function verifySignature(request: Request, body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // skip verification if no secret configured

  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')
  if (!xSignature || !xRequestId) return false

  const parts = Object.fromEntries(
    xSignature.split(',').map(p => {
      const [k, v] = p.trim().split('=')
      return [k, v]
    })
  )
  const ts = parts['ts']
  const hash = parts['v1']
  if (!ts || !hash) return false

  const dataId = JSON.parse(body)?.data?.id
  const manifest = `id:${dataId ?? ''};request-id:${xRequestId};ts:${ts};`
  const computed = createHmac('sha256', secret).update(manifest).digest('hex')

  return computed === hash
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    if (!verifySignature(request, rawBody)) {
      console.warn('Webhook MP: invalid signature')
      return NextResponse.json({ ok: true })
    }

    const body = JSON.parse(rawBody)

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

      // Find user by MP subscription ID, external_reference (our user ID) or payer email.
      // El email es respaldo por si external_reference no llega desde el checkout del plan.
      const orConds: Array<{ mpSuscripcionId?: string; id?: string; email?: string }> = [{ mpSuscripcionId: suscripcionId }]
      if (mp.external_reference) orConds.push({ id: mp.external_reference })
      if (mp.payer_email) orConds.push({ email: mp.payer_email })

      const user = await prisma.usuario.findFirst({
        where: { OR: orConds },
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
