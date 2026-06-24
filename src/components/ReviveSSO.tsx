'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Orígenes autorizados a iniciar sesión por SSO dentro del iframe.
const ALLOWED_PARENT_ORIGINS = [
  'https://revivevirtual.com',
  'https://www.revivevirtual.com',
]

function getParentOrigin(): string | null {
  try {
    const ao = window.location.ancestorOrigins
    if (ao && ao.length > 0) return ao[0]
  } catch {
    /* ancestorOrigins no soportado (Firefox) */
  }
  if (document.referrer) {
    try {
      return new URL(document.referrer).origin
    } catch {
      /* referrer inválido */
    }
  }
  return null
}

/**
 * Handshake SSO con Revive cuando la app corre embebida en un iframe.
 * No hace nada si la app se abre directamente (fuera de iframe), por lo que
 * la experiencia de los usuarios directos no se ve afectada.
 *
 *  1. Avisa al contenedor con PR_IFRAME_READY.
 *  2. Recibe PR_SSO_TOKEN (validando el origin), lo canjea en /api/auth/sso.
 *  3. Activa la sesión con setSession y responde PR_SSO_OK / PR_SSO_ERROR.
 */
export default function ReviveSSO() {
  const router = useRouter()

  useEffect(() => {
    // Solo actuar dentro de un iframe.
    if (window.self === window.top) return

    const supabase = createClient()

    const parentOrigin = getParentOrigin()
    const readyTargets =
      parentOrigin && ALLOWED_PARENT_ORIGINS.includes(parentOrigin)
        ? [parentOrigin]
        : ALLOWED_PARENT_ORIGINS

    const onMessage = async (event: MessageEvent) => {
      if (!ALLOWED_PARENT_ORIGINS.includes(event.origin)) return
      const data = event.data
      if (!data || data.type !== 'PR_SSO_TOKEN' || typeof data.token !== 'string') return

      const reply = (msg: unknown) => {
        try {
          ;(event.source as Window | null)?.postMessage(msg, event.origin)
        } catch {
          /* contenedor cerrado */
        }
      }

      try {
        const res = await fetch('/api/auth/sso', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token: data.token }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `sso_failed_${res.status}`)
        }
        const { access_token, refresh_token } = await res.json()
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) throw error

        reply({ type: 'PR_SSO_OK' })
        router.refresh()
      } catch (e) {
        reply({ type: 'PR_SSO_ERROR', error: e instanceof Error ? e.message : String(e) })
      }
    }

    window.addEventListener('message', onMessage)

    // Avisar al contenedor que el iframe está listo para recibir el token.
    for (const target of readyTargets) {
      try {
        window.parent.postMessage({ type: 'PR_IFRAME_READY' }, target)
      } catch {
        /* origin no permitido por el navegador */
      }
    }

    return () => window.removeEventListener('message', onMessage)
  }, [router])

  return null
}
