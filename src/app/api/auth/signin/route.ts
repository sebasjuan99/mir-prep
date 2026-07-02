import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { verifyTurnstile } from '@/lib/turnstile'
import { enforceRateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.email || !body?.password || !body?.turnstileToken) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { email, password, turnstileToken } = body

  // Rate limiting: frena fuerza bruta por IP y contra una cuenta concreta.
  const ip = getClientIp(request)
  const emailKey = String(email).toLowerCase()
  const limited = await enforceRateLimit([
    { key: `signin:ip:${ip}`, limit: 10, windowSec: 600 },
    { key: `signin:email:${emailKey}`, limit: 5, windowSec: 900 },
  ])
  if (limited) return tooManyRequests(limited.reset)

  const turnstileOk = await verifyTurnstile(turnstileToken)
  if (!turnstileOk) {
    return NextResponse.json(
      { error: 'Verificación de seguridad fallida. Inténtalo de nuevo.' },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { pendingCookies.push(...cookiesToSet) },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const isEmailNotConfirmed = error.message.toLowerCase().includes('email not confirmed')
    const message = isEmailNotConfirmed
      ? 'Debes verificar tu correo electrónico antes de iniciar sesión.'
      : 'Correo o contraseña incorrectos.'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )
  return response
}
