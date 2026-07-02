import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { verifyTurnstile } from '@/lib/turnstile'
import { prisma } from '@/lib/prisma'
import { enforceRateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.email || !body?.password || !body?.turnstileToken) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { email, password, turnstileToken } = body

  // Rate limiting: evita creación masiva de cuentas desde una misma IP.
  const ip = getClientIp(request)
  const limited = await enforceRateLimit([
    { key: `signup:ip:${ip}`, limit: 5, windowSec: 3600 },
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // identities vacío => Supabase devolvió un usuario ofuscado porque el email
  // ya existe y está confirmado (no es un alta real): no tocamos el perfil.
  // Si es un alta real, creamos el perfil o re-vinculamos su auth_id (por si
  // habia un perfil huerfano de un registro anterior con el mismo email).
  if (data.user && (data.user.identities?.length ?? 0) > 0) {
    await prisma.usuario.upsert({
      where: { email },
      create: { auth_id: data.user.id, email, role: 'user' },
      update: { auth_id: data.user.id },
    }).catch(() => null)
  }

  return NextResponse.json({ success: true })
}
