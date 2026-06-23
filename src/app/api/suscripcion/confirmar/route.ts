import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { obtenerSuscripcion, MP_PLAN_ID } from '@/lib/mercadopago'

// Vincula la suscripción al usuario logueado a partir del preapproval_id que
// Mercado Pago añade a la back_url al volver del checkout. Es el mecanismo fiable
// de vinculación, ya que el checkout del plan no devuelve external_reference ni
// payer_email utilizables en el webhook.
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const preapprovalId = body?.preapproval_id
  if (!preapprovalId || typeof preapprovalId !== 'string') {
    return NextResponse.json({ error: 'Falta preapproval_id' }, { status: 400 })
  }

  const dbUser = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  try {
    const mp = await obtenerSuscripcion(preapprovalId)

    // Verificamos que la suscripción sea de nuestro plan antes de vincularla.
    if (mp.preapproval_plan_id && mp.preapproval_plan_id !== MP_PLAN_ID) {
      return NextResponse.json({ error: 'Suscripción no válida' }, { status: 400 })
    }

    const statusMap: Record<string, string> = {
      pending: 'pending',
      authorized: 'authorized',
      paused: 'paused',
      cancelled: 'cancelled',
    }
    const newStatus = statusMap[mp.status] || mp.status

    await prisma.usuario.update({
      where: { id: dbUser.id },
      data: {
        mpSuscripcionId: preapprovalId,
        suscripcionStatus: newStatus,
        ...(mp.next_payment_date ? { suscripcionExpira: new Date(mp.next_payment_date) } : {}),
      },
    })

    return NextResponse.json({ status: newStatus, expira: mp.next_payment_date ?? null })
  } catch (e) {
    console.error('Error confirmando suscripción:', e)
    return NextResponse.json({ error: 'No se pudo confirmar la suscripción' }, { status: 500 })
  }
}
