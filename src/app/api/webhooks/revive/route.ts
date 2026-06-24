import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

// Webhook de suscripción de Revive. Sincroniza el acceso del usuario en la
// tabla Usuario a partir de los eventos de facturación de Revive.
//
// Reglas acordadas:
//  - Revive crea el usuario en auth.users; nosotros gestionamos el perfil.
//  - Sin período de gracia: el acceso se corta al vencer (o ante impago).
//  - Cada fuente gestiona los suyos: no tocamos usuarios de MercadoPago.
//  - Idempotente por event_id (los reintentos no cuentan doble).

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const provided = signature.replace(/^sha256=/, '')
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(computed)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const secret = process.env.SSO_SHARED_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook no configurado en el servidor.' }, { status: 503 })
  }

  const rawBody = await request.text()
  if (!verifySignature(rawBody, request.headers.get('x-revive-signature'), secret)) {
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const event = typeof body.event === 'string' ? body.event : null
  const eventId = body.event_id != null ? String(body.event_id) : null
  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : null
  const plan = typeof body.plan === 'string' ? body.plan : null
  const currentPeriodEnd = typeof body.current_period_end === 'string' ? body.current_period_end : null

  if (!event || !eventId || !email) {
    return NextResponse.json({ error: 'Faltan campos: event, email, event_id.' }, { status: 400 })
  }

  // Validar la fecha antes de reservar idempotencia (un 400 debe poder reintentarse).
  let expira: Date | null = null
  if (event === 'payment.success') {
    if (!currentPeriodEnd) {
      return NextResponse.json({ error: 'Falta current_period_end.' }, { status: 400 })
    }
    expira = new Date(currentPeriodEnd)
    if (isNaN(expira.getTime())) {
      return NextResponse.json({ error: 'current_period_end inválido.' }, { status: 400 })
    }
  }

  // No gestionamos usuarios cuya suscripción es de MercadoPago.
  const existing = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, suscripcionOrigen: true },
  })
  if (existing && existing.suscripcionOrigen === 'mercadopago') {
    return NextResponse.json({ ok: true, skipped: 'mercadopago_user' })
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Reserva de idempotencia: si el event_id ya existe, lanza P2002.
      await tx.integrationEvent.create({ data: { id: eventId, kind: 'revive_webhook' } })

      if (event === 'payment.success') {
        const incremento = plan === 'annual' ? 12 : 1
        if (existing) {
          await tx.usuario.update({
            where: { id: existing.id },
            data: {
              suscripcionOrigen: 'revive',
              suscripcionStatus: 'authorized',
              suscripcionExpira: expira!,
              mesesPagados: { increment: incremento },
            },
          })
        } else {
          // Usuario nuevo: resolvemos el auth_id que Revive creó en auth.users.
          const rows = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM auth.users WHERE lower(email) = ${email} LIMIT 1
          `
          const authId = rows[0]?.id
          if (!authId) throw new Error('USER_NOT_FOUND')
          await tx.usuario.create({
            data: {
              auth_id: authId,
              email,
              role: 'user',
              suscripcionOrigen: 'revive',
              suscripcionStatus: 'authorized',
              suscripcionExpira: expira!,
              mesesPagados: incremento,
            },
          })
        }
      } else if (event === 'payment.failed') {
        // Sin gracia: corte inmediato.
        if (existing) {
          await tx.usuario.update({
            where: { id: existing.id },
            data: { suscripcionStatus: 'paused', suscripcionExpira: new Date() },
          })
        }
      } else if (event === 'subscription.cancelled') {
        // No renueva; conserva el acceso hasta la fecha ya pagada.
        if (existing) {
          await tx.usuario.update({
            where: { id: existing.id },
            data: { suscripcionStatus: 'cancelled' },
          })
        }
      }
      // Otros eventos: solo queda registrada la idempotencia, sin cambios.
    })
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === 'P2002') {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Usuario no existe en auth.users. Revive debe crearlo antes de cobrar.' },
        { status: 404 }
      )
    }
    console.error('Webhook Revive error:', e)
    return NextResponse.json({ error: 'Error procesando el evento.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
