import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { enforceRateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.email) {
    return NextResponse.json({ error: 'Falta el email' }, { status: 400 })
  }

  // Rate limiting: este endpoint envía correo, así que limitamos por IP y por
  // email para evitar "email bombing".
  const ip = getClientIp(request)
  const emailKey = String(body.email).toLowerCase()
  const limited = await enforceRateLimit([
    { key: `forgot:ip:${ip}`, limit: 5, windowSec: 3600 },
    { key: `forgot:email:${emailKey}`, limit: 3, windowSec: 3600 },
  ])
  if (limited) return tooManyRequests(limited.reset)

  const cookieStore = await cookies()
  // Collect cookies Supabase wants to set (e.g. the PKCE code-verifier) so we can
  // forward them on the response. Without this the verifier is lost and the later
  // exchangeCodeForSession() in /auth/callback fails.
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.proximoresidente.com'
  const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
    redirectTo: `${appUrl}/auth/callback`,
  })

  // Always return success to avoid email enumeration
  if (error) console.error('[forgot-password]', error.message)

  const response = NextResponse.json({ success: true })
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )
  response.cookies.set('mir_recovery', '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  })
  return response
}
