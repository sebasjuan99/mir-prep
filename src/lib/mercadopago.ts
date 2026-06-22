const MP_API = 'https://api.mercadopago.com'

function headers() {
  return {
    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export async function crearSuscripcion(payerEmail: string, externalReference: string) {
  const backUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.proximoresidente.com') + '/suscripcion/estado'

  const res = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      reason: 'MIR Prep - Suscripción Mensual',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 87000,
        currency_id: 'COP',
      },
      payer_email: payerEmail,
      external_reference: externalReference,
      back_url: backUrl,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MP create subscription failed: ${res.status} ${err}`)
  }

  return res.json() as Promise<{
    id: string
    init_point: string
    status: string
  }>
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
