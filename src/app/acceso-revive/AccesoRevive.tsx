'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ALLOWED_PARENT_ORIGINS, getParentOrigin } from '@/lib/revive'
import { C, G, R, S, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'

/**
 * Pantalla de acceso EXCLUSIVA para la integración con Revive.
 *
 * A los usuarios embebidos en el iframe de Revive el middleware los trae aquí
 * (no a /login) porque su identidad ya la valida Revive: no necesitan escribir
 * correo ni contraseña, y NO se muestra el Turnstile de Cloudflare (que además
 * se rompe dentro de un iframe anidado en Safari).
 *
 * El clic en "Iniciar sesión" cumple dos funciones:
 *   1. Es el gesto de usuario que Safari exige para conceder acceso al
 *      almacenamiento (Storage Access API) → sin él la cookie de sesión no
 *      persiste dentro del iframe en Safari.
 *   2. Canjea el token SSO que Revive envía por postMessage y activa la sesión.
 */

type Estado = 'esperando' | 'listo' | 'ingresando' | 'ok' | 'error' | 'sin-embed'

export default function AccesoRevive() {
  const router = useRouter()
  const tokenRef = useRef<string | null>(null)
  const [estado, setEstado] = useState<Estado>('esperando')
  const [errorMsg, setErrorMsg] = useState('')

  // Handshake con Revive: anunciar que el iframe está listo y recibir el token.
  useEffect(() => {
    // Fuera de un iframe esta página no tiene sentido (acceso directo).
    if (window.self === window.top) {
      setEstado('sin-embed')
      return
    }

    const parentOrigin = getParentOrigin()
    const readyTargets =
      parentOrigin && ALLOWED_PARENT_ORIGINS.includes(parentOrigin)
        ? [parentOrigin]
        : ALLOWED_PARENT_ORIGINS

    const onMessage = (event: MessageEvent) => {
      if (!ALLOWED_PARENT_ORIGINS.includes(event.origin)) return
      const data = event.data
      if (!data || data.type !== 'PR_SSO_TOKEN' || typeof data.token !== 'string') return
      tokenRef.current = data.token
      // No pisar un login en curso o ya resuelto.
      setEstado(prev => (prev === 'ingresando' || prev === 'ok' ? prev : 'listo'))
    }
    window.addEventListener('message', onMessage)

    // Avisar al contenedor que el iframe está listo (reintenta ~12s por si su
    // listener se monta un poco más tarde). Mismo patrón que ReviveSSO.
    const announceReady = () => {
      for (const target of readyTargets) {
        try {
          window.parent.postMessage({ type: 'PR_IFRAME_READY' }, target)
        } catch {
          /* origin no permitido por el navegador */
        }
      }
    }
    announceReady()
    let attempts = 0
    const readyInterval = setInterval(() => {
      if (tokenRef.current || ++attempts >= 24) {
        clearInterval(readyInterval)
        return
      }
      announceReady()
    }, 500)

    return () => {
      window.removeEventListener('message', onMessage)
      clearInterval(readyInterval)
    }
  }, [])

  const ingresar = useCallback(async () => {
    setEstado('ingresando')
    setErrorMsg('')
    try {
      // 1) Gesto de usuario → desbloquear el almacenamiento en Safari. En otros
      //    navegadores puede no hacer falta o rechazar: lo ignoramos.
      try {
        if ('requestStorageAccess' in document && typeof document.requestStorageAccess === 'function') {
          await document.requestStorageAccess()
        }
      } catch {
        /* acceso denegado o innecesario — continuamos igual */
      }

      // 2) Canjear el token SSO que envió Revive.
      const token = tokenRef.current
      if (!token) {
        throw new Error('No recibimos el acceso desde Revive. Recarga la página e inténtalo de nuevo.')
      }

      const res = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `No se pudo iniciar sesión (${res.status}).`)
      }
      const { access_token, refresh_token } = await res.json()

      // 3) Activar la sesión (escribe la cookie, ya con acceso al almacenamiento).
      const supabase = createClient()
      const { error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (error) throw error

      setEstado('ok')
      try {
        window.parent.postMessage({ type: 'PR_SSO_OK' }, '*')
      } catch {
        /* contenedor no disponible */
      }
      router.replace('/dashboard')
      router.refresh()
    } catch (e) {
      // El token es de un solo uso: para reintentar pedimos uno nuevo a Revive.
      tokenRef.current = null
      const parentOrigin = getParentOrigin()
      const target = parentOrigin && ALLOWED_PARENT_ORIGINS.includes(parentOrigin) ? parentOrigin : '*'
      try {
        window.parent.postMessage({ type: 'PR_IFRAME_READY' }, target)
      } catch {
        /* ignore */
      }
      setEstado('error')
      setErrorMsg(e instanceof Error ? e.message : 'Ocurrió un error inesperado.')
    }
  }, [router])

  const cargando = estado === 'ingresando'
  const botonListo = estado === 'listo' || estado === 'error'

  return (
    <main
      style={{
        ...bodyFont,
        minHeight: '100vh',
        background: C.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 6vw, 64px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Acentos decorativos (mismos que el resto de la marca) */}
      <div
        aria-hidden
        style={{ position: 'absolute', top: -110, left: -110, width: 300, height: 300, borderRadius: '50%', background: C.pinkSoft }}
      />
      <div
        aria-hidden
        style={{ position: 'absolute', bottom: -120, right: -120, width: 320, height: 320, borderRadius: '50%', background: C.purpleSoft }}
      />

      <div style={{ position: 'relative', width: '100%', maxWidth: 520, textAlign: 'left' }}>
        {/* Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <Image src="/revive-icon-color.png" alt="Próximo Residente" width={64} height={64} style={{ objectFit: 'contain' }} priority />
          <span style={{ ...bodyFont, fontWeight: 500, fontSize: 15, color: C.ink }}>Próximo Residente</span>
        </div>

        <div style={{ ...kicker(), marginBottom: 22 }}>ACCESO · REVIVE</div>

        <h1 style={{ ...disp, fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', color: C.ink, margin: 0, marginBottom: 22 }}>
          Inicia el camino a ser especialista.
        </h1>

        <p style={{ ...bodyFont, fontSize: 17, color: C.ink2, maxWidth: 420, lineHeight: 1.65, marginBottom: 40 }}>
          Tu preparación te espera. Entra con un clic y continúa donde lo dejaste.
        </p>

        {estado === 'sin-embed' ? (
          <div>
            <div style={{ background: C.pinkSoft, border: '1px solid #F8D6E2', borderRadius: R.md, padding: '14px 18px', ...mono, fontSize: 11, letterSpacing: '0.06em', color: '#AF296D', marginBottom: 20 }}>
              ESTA PÁGINA ES EL ACCESO DESDE REVIVE.
            </div>
            <a
              href="/login"
              style={{ ...bodyFont, fontSize: 14, fontWeight: 500, display: 'inline-block', border: `1px solid ${C.purple}`, borderRadius: R.sm, background: 'transparent', color: C.purple, padding: '14px 24px', textDecoration: 'none' }}
            >
              Ir al inicio de sesión normal →
            </a>
          </div>
        ) : (
          <>
            <button
              onClick={ingresar}
              disabled={!botonListo}
              style={{
                ...bodyFont,
                fontSize: 16,
                fontWeight: 600,
                background: G.brandVivid,
                color: '#FFFFFF',
                border: '1px solid transparent',
                borderRadius: R.sm,
                boxShadow: S.brand,
                padding: '18px 28px',
                width: '100%',
                maxWidth: 380,
                cursor: !botonListo ? 'not-allowed' : 'pointer',
                opacity: !botonListo ? 0.5 : cargando ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {estado === 'esperando' && 'Preparando acceso…'}
              {estado === 'listo' && 'Iniciar sesión →'}
              {estado === 'ingresando' && 'Ingresando…'}
              {estado === 'ok' && 'Listo ✓'}
              {estado === 'error' && 'Reintentar →'}
            </button>

            {estado === 'error' && errorMsg && (
              <div style={{ ...mono, fontSize: 11, letterSpacing: '0.05em', color: C.danger, marginTop: 16, maxWidth: 380, lineHeight: 1.5 }}>
                {errorMsg}
              </div>
            )}
            {estado === 'esperando' && (
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', color: C.ink2, marginTop: 14 }}>
                CONECTANDO CON REVIVE…
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
