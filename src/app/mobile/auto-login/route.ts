import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verificarTokenRevive, generarTokenHashSesion, type ReviveSsoError } from '@/lib/revive-sso'

// Auto-login desde la app móvil de Revive (navegación de página completa, NO
// iframe: en móvil el iframe pierde las cookies de terceros).
//
//   GET /mobile/auto-login?token=<JWT SSO de Revive>
//
// Token válido → fija la cookie de sesión de Supabase y redirige a /dashboard.
// Token inválido/caducado/usado → redirige a /login?revive_error=<código>.
// Nunca recibe contraseñas: la seguridad la da la firma del token (un solo uso,
// exp corto). La redirección saca el token de la URL antes de que la página
// cargue analítica (GA4/Meta) y Referrer-Policy evita que se filtre a terceros.

const SIN_CACHE = {
  'Cache-Control': 'no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
}

function redirigir(request: NextRequest, pathname: string, error?: ReviveSsoError) {
  const url = new URL(pathname, request.nextUrl.origin)
  if (error) url.searchParams.set('revive_error', error)
  const res = NextResponse.redirect(url, 303)
  Object.entries(SIN_CACHE).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return redirigir(request, '/login', 'token_invalido')

  const verificado = await verificarTokenRevive(token)
  if (!verificado.ok) return redirigir(request, '/login', verificado.error)

  const hash = await generarTokenHashSesion(verificado.value.email)
  if (!hash.ok) return redirigir(request, '/login', hash.error)

  // Canjear el token_hash con un cliente SSR ligado a la respuesta de
  // redirección: así Supabase escribe las cookies de sesión en esa respuesta.
  const response = redirigir(request, '/dashboard')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: hash.value,
    type: 'email',
  })
  if (error || !data?.session) return redirigir(request, '/login', 'error_servidor')

  return response
}
