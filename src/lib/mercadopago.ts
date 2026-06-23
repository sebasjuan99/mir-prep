const MP_API = 'https://api.mercadopago.com'

function headers() {
  return {
    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

// Plan de suscripción con 7 días de prueba gratis (free_trial), creado en Mercado Pago.
// El free_trial sólo es posible mediante un plan asociado, por eso no creamos la
// suscripción por API sino que redirigimos al checkout del plan. Mercado Pago recoge
// la tarjeta, aplica los 7 días gratis y dispara el webhook subscription_preapproval.
const MP_PLAN_ID = process.env.MP_PREAPPROVAL_PLAN_ID || '4270f42f36d0400988ea6af442afd2da'

export function crearCheckoutSuscripcion(externalReference: string) {
  const params = new URLSearchParams({
    preapproval_plan_id: MP_PLAN_ID,
    external_reference: externalReference,
  })
  // Dominio de Colombia (MCO). external_reference viaja al preapproval creado
  // para poder vincular la suscripción con el usuario en el webhook.
  return `https://www.mercadopago.com.co/subscriptions/checkout?${params.toString()}`
}

export async function obtenerSuscripcion(suscripcionId: string) {
  const res = await fetch(`${MP_API}/preapproval/${suscripcionId}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MP get subscription failed: ${res.status} ${err}`)
  }

  return res.json() as Promise<{
    id: string
    status: string
    payer_email: string
    external_reference: string
    date_created: string
    last_modified: string
    auto_recurring: {
      frequency: number
      frequency_type: string
      transaction_amount: number
      currency_id: string
    }
    next_payment_date: string
  }>
}

export async function cancelarSuscripcion(suscripcionId: string) {
  const res = await fetch(`${MP_API}/preapproval/${suscripcionId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ status: 'cancelled' }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MP cancel subscription failed: ${res.status} ${err}`)
  }

  return res.json() as Promise<{ id: string; status: string }>
}
