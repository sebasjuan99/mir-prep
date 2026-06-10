import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.email) {
    return NextResponse.json({ error: 'Falta el email' }, { status: 400 })
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mir-prep.vercel.app'
  const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
    redirectTo: `${appUrl}/auth/callback`,
  })

  // Always return success to avoid email enumeration
  if (error) console.error('[forgot-password]', error.message)

  const response = NextResponse.json({ success: true })
  response.cookies.set('mir_recovery', '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  })
  return response
}
