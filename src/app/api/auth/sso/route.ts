import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin, SERVICE_ROLE_MISSING_MSG } from '@/lib/supabase/admin'

// SSO de entrada desde Revive: recibe un JWT firmado (HS256) generado por el
// backend de Revive, lo valida, y devuelve una sesión real de Supabase para
// que el iframe la active con supabase.auth.setSession(). No usa cookies de
// terceros y NO crea usuarios (Revive ya crea el usuario en auth.users).

export async function POST(request: Request) {
  const secret = process.env.SSO_SHARED_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'SSO no configurado en el servidor.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  const token = body?.token
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Falta el token.' }, { status: 400 })
  }

  // 1) Validar firma + iss/aud + expiración (jose verifica exp automáticamente)
  let payload: Record<string, unknown>
  try {
    const result = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: 'revive',
      audience: 'proximoresidente',
      algorithms: ['HS256'],
    })
    payload = result.payload as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 })
  }

  const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : null
  const jti = typeof payload.jti === 'string' ? payload.jti : null
  if (!email || !jti) {
    return NextResponse.json({ error: 'Token sin email o jti.' }, { status: 400 })
  }

  // 2) Un solo uso: registrar el jti. Si ya existía, es un replay.
  try {
    await prisma.integrationEvent.create({ data: { id: jti, kind: 'sso_jti' } })
  } catch {
    return NextResponse.json({ error: 'Token ya utilizado.' }, { status: 409 })
  }

  // 3) Mintear sesión de Supabase para ese usuario (debe existir en auth.users).
  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: SERVICE_ROLE_MISSING_MSG }, { status: 503 })
  }

  // generateLink('magiclink') solo funciona si el usuario YA existe → si no
  // existe, devolvemos error (no creamos usuarios; eso lo hace Revive).
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: 'Usuario no encontrado. Revive debe crearlo antes del SSO.' },
      { status: 404 }
    )
  }

  // Intercambiar el token_hash por una sesión (access_token + refresh_token).
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data: verifyData, error: verifyError } = await anon.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  })
  if (verifyError || !verifyData?.session) {
    return NextResponse.json({ error: 'No se pudo crear la sesión.' }, { status: 500 })
  }

  return NextResponse.json({
    access_token: verifyData.session.access_token,
    refresh_token: verifyData.session.refresh_token,
  })
}
