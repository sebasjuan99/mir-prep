import { NextResponse } from 'next/server'

// TEMPORARY diagnostic route — remove after debugging the subscription 500.
// Protected by a key so it is not publicly discoverable.
const DIAG_KEY = 'mp-diag-7f3a9c'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('key') !== DIAG_KEY) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const token = process.env.MP_ACCESS_TOKEN || ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '(unset)'
  const backUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.proximoresidente.com') + '/suscripcion/estado'

  const env = {
    MP_ACCESS_TOKEN_present: token.length > 0,
    MP_ACCESS_TOKEN_prefix: token.slice(0, 8),
    MP_ACCESS_TOKEN_length: token.length,
    NEXT_PUBLIC_APP_URL: appUrl,
    computed_back_url: backUrl,
  }

  let mp: unknown = null
  try {
    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'MIR Prep - Suscripción Mensual',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 87000,
          currency_id: 'COP',
        },
        payer_email: 'diag_probe_001@gmail.com',
        external_reference: 'diag-probe',
        back_url: backUrl,
      }),
    })
    const text = await res.text()
    mp = { status: res.status, ok: res.ok, body: text.slice(0, 600) }
  } catch (e) {
    mp = { fetchError: String(e) }
  }

  return NextResponse.json({ env, mp })
}
