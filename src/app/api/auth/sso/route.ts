import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SERVICE_ROLE_MISSING_MSG } from '@/lib/supabase/admin'
import { verificarTokenRevive, generarTokenHashSesion, type ReviveSsoError } from '@/lib/revive-sso'

// SSO de entrada desde Revive: recibe un JWT firmado (HS256) generado por el
// backend de Revive, lo valida, y devuelve una sesión real de Supabase para
// que el iframe la active con supabase.auth.setSession(). No usa cookies de
// terceros y NO crea usuarios (Revive ya crea el usuario en auth.users).

const ERRORES: Record<ReviveSsoError, [string, number]> = {
  no_configurado: ['SSO no configurado en el servidor.', 503],
  token_invalido: ['Token inválido o expirado.', 401],
  token_usado: ['Token ya utilizado.', 409],
  usuario_no_encontrado: ['Usuario no encontrado. Revive debe crearlo antes del SSO.', 404],
  error_servidor: ['No se pudo crear la sesión.', 500],
}

function errorResponse(code: ReviveSsoError) {
  const [msg, status] = ERRORES[code]
  return NextResponse.json({ error: msg }, { status })
}

export async function POST(request: Request) {
  if (!process.env.SSO_SHARED_SECRET) return errorResponse('no_configurado')

  const body = await request.json().catch(() => null)
  const token = body?.token
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Falta el token.' }, { status: 400 })
  }

  const verificado = await verificarTokenRevive(token)
  if (!verificado.ok) return errorResponse(verificado.error)

  const hash = await generarTokenHashSesion(verificado.value.email)
  if (!hash.ok) {
    if (hash.error === 'no_configurado') {
      return NextResponse.json({ error: SERVICE_ROLE_MISSING_MSG }, { status: 503 })
    }
    return errorResponse(hash.error)
  }

  // Intercambiar el token_hash por una sesión (access_token + refresh_token).
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data: verifyData, error: verifyError } = await anon.auth.verifyOtp({
    token_hash: hash.value,
    type: 'email',
  })
  if (verifyError || !verifyData?.session) return errorResponse('error_servidor')

  return NextResponse.json({
    access_token: verifyData.session.access_token,
    refresh_token: verifyData.session.refresh_token,
  })
}
