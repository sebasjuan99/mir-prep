import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/login?verified=true'
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')

  // Supabase redirects here with ?error=... when OTP is expired or invalid
  if (error) {
    if (errorCode === 'otp_expired') {
      return NextResponse.redirect(`${origin}/login?link_expired=true`)
    }
    return NextResponse.redirect(`${origin}/login?error=verification_failed`)
  }

  if (code) {
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

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const isRecovery = cookieStore.get('mir_recovery')?.value === '1'
      const destination = isRecovery ? '/reset-password' : next
      const response = NextResponse.redirect(`${origin}${destination}`)
      pendingCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
      )
      if (isRecovery) {
        response.cookies.set('mir_recovery', '', { maxAge: 0, path: '/' })
      }
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
