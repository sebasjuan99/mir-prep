import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  // Forward pathname to server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // ¿La app corre embebida en el iframe de Revive? Distinguimos el iframe de una
  // navegación cross-site normal (p. ej. llegar desde un enlace externo):
  //   - documento cargado en iframe → Sec-Fetch-Dest: iframe
  //   - fetch/RSC desde dentro del iframe → Sec-Fetch-Site: cross-site + Dest ≠ document
  // Una navegación de nivel superior es Dest: document → NO se trata como embed.
  const secFetchSite = request.headers.get('sec-fetch-site')
  const secFetchDest = request.headers.get('sec-fetch-dest')
  const isEmbedded =
    secFetchDest === 'iframe' ||
    (secFetchSite === 'cross-site' && secFetchDest !== 'document')

  // Embebido: al refrescar la sesión hay que reescribir la cookie como
  // SameSite=None; Secure; Partitioned (CHIPS), o Safari la descarta por ser
  // "de terceros" y el usuario queda deslogueado en el siguiente request.
  // Los usuarios directos (same-site) conservan los valores por defecto.
  const crossSiteCookie = (options: Record<string, unknown> | undefined) =>
    isEmbedded
      ? { ...options, sameSite: 'none' as const, secure: true, partitioned: true }
      : options

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, crossSiteCookie(options))
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const REVIVE_ENTRY = '/acceso-revive'
  const isPublicRoute = ['/', '/home-v1', '/login', '/register', '/forgot-password', '/reset-password', REVIVE_ENTRY].includes(pathname) ||
                        pathname.startsWith('/auth/')
  const isApiRoute = pathname.startsWith('/api/')
  const isStaticAsset = pathname.startsWith('/_next/') ||
                        pathname.includes('.')

  if (isStaticAsset) return supabaseResponse

  // Supabase falls back to Site URL (/) when redirectTo isn't allowlisted — catch it here
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // ── Integración Revive: embudo unificado por /acceso-revive ──────────────
  // Los usuarios embebidos NO pasan por /login (que carga Turnstile y se rompe
  // en el iframe de Safari); su identidad la valida Revive por SSO.
  if (isEmbedded && !isApiRoute) {
    if (!user) {
      // Sin sesión → llevarlos a la pantalla de acceso de Revive (con botón).
      if (pathname !== REVIVE_ENTRY && !pathname.startsWith('/auth/')) {
        const url = request.nextUrl.clone()
        url.pathname = REVIVE_ENTRY
        url.search = ''
        return NextResponse.redirect(url)
      }
    } else {
      // Con sesión: no dejarlos en la landing/login/acceso, y la cuenta la
      // gestionan en Revive (no mostramos ni servimos /cuenta embebido).
      if (['/', '/login', '/register', REVIVE_ENTRY].includes(pathname) || pathname.startsWith('/cuenta')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        url.search = ''
        return NextResponse.redirect(url)
      }
    }
  }

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If authenticated and trying to access login/register, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
