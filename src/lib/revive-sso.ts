import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// Validación compartida del token SSO de Revive. La usan:
//   - POST /api/auth/sso          (iframe: devuelve tokens por JSON)
//   - GET  /mobile/auto-login     (móvil: fija cookie y redirige)
// El token es un JWT HS256 firmado con SSO_SHARED_SECRET por el backend de
// Revive (iss=revive, aud=proximoresidente, email, jti, exp corto).

export type ReviveSsoError =
  | 'no_configurado'
  | 'token_invalido'
  | 'token_usado'
  | 'usuario_no_encontrado'
  | 'error_servidor'

type Result<T> = { ok: true; value: T } | { ok: false; error: ReviveSsoError }

// Verifica firma, iss/aud y expiración, y consume el jti (un solo uso).
export async function verificarTokenRevive(token: string): Promise<Result<{ email: string }>> {
  const secret = process.env.SSO_SHARED_SECRET
  if (!secret) return { ok: false, error: 'no_configurado' }

  let payload: Record<string, unknown>
  try {
    const result = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: 'revive',
      audience: 'proximoresidente',
      algorithms: ['HS256'],
    })
    payload = result.payload as Record<string, unknown>
  } catch {
    return { ok: false, error: 'token_invalido' }
  }

  const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : null
  const jti = typeof payload.jti === 'string' ? payload.jti : null
  if (!email || !jti) return { ok: false, error: 'token_invalido' }

  // Un solo uso: registrar el jti. Si ya existía, es un replay.
  try {
    await prisma.integrationEvent.create({ data: { id: jti, kind: 'sso_jti' } })
  } catch {
    return { ok: false, error: 'token_usado' }
  }

  return { ok: true, value: { email } }
}

// Genera un token_hash de magic link para un usuario YA existente en auth.users
// (no crea usuarios: eso lo hace Revive). Se canjea con verifyOtp({type:'email'}).
export async function generarTokenHashSesion(email: string): Promise<Result<string>> {
  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'no_configurado' }

  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !data?.properties?.hashed_token) {
    return { ok: false, error: 'usuario_no_encontrado' }
  }
  return { ok: true, value: data.properties.hashed_token }
}
