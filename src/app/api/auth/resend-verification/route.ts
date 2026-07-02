import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { enforceRateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.email) {
    return NextResponse.json({ error: 'Falta el email' }, { status: 400 })
  }

  // Rate limiting: reenvío de verificación también envía correo → limitamos
  // por IP y por email.
  const ip = getClientIp(request)
  const emailKey = String(body.email).toLowerCase()
  const limited = await enforceRateLimit([
    { key: `resend:ip:${ip}`, limit: 5, windowSec: 3600 },
    { key: `resend:email:${emailKey}`, limit: 3, windowSec: 3600 },
  ])
  if (limited) return tooManyRequests(limited.reset)

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.proximoresidente.com'
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: body.email,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  })

  if (error) {
    return NextResponse.json({ error: 'No se pudo reenviar el correo.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
