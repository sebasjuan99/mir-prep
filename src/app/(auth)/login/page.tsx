'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import { C, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'

const inputStyle = {
  ...bodyFont,
  width: '100%',
  padding: '14px 16px',
  border: inkBorder,
  borderRadius: 0,
  background: C.cream2,
  color: C.ink,
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

function Banner({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: inkBorder, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em', color, marginBottom: 20 }}>
      {children}
    </div>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [banner, setBanner] = useState<'verified' | 'link_expired' | 'error' | 'password_reset' | null>(null)
  const [turnstileError, setTurnstileError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('verified') === 'true') setBanner('verified')
    else if (searchParams.get('link_expired') === 'true') setBanner('link_expired')
    else if (searchParams.get('error') === 'verification_failed') setBanner('error')
    else if (searchParams.get('password_reset') === 'true') setBanner('password_reset')
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!turnstileToken) { setError('Completa la verificación de seguridad'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) { setError('Escribe tu email primero para reenviar la verificación'); return }
    setResendLoading(true)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendSent(true)
    } finally {
      setResendLoading(false)
    }
  }

  const emailNotConfirmed = error.toLowerCase().includes('verificar tu correo')

  return (
    <div className="auth-grid" style={{ ...bodyFont }}>

      {/* LEFT PANEL — pink */}
      <div className="auth-panel-left" style={{ background: C.pink, padding: '56px 52px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textDecoration: 'none' }}>
            <Image src="/ape-logo-negro.png" alt="Aurora Pixel Studio" width={88} height={88} style={{ objectFit: 'contain' }} />
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.14em', color: C.ink }}>Próximo Residente</span>
          </Link>
          <span style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: `2px solid ${C.ink}`, borderRadius: 999, padding: '4px 10px', color: C.ink }}>ACCESO</span>
        </div>

        <div>
          <div style={{ ...kicker(), marginBottom: 28 }}>RESIDENTE VERIFICADO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 4.5vw, 6rem)', color: C.ink, margin: 0, marginBottom: 24 }}>
            BIENVENIDO<br />DE VUELTA.
          </h2>
          <p style={{ ...bodyFont, fontSize: 17, color: C.ink, opacity: 0.75, maxWidth: 340, lineHeight: 1.55 }}>
            Continúa donde lo dejaste. Tu progreso y tus fichas de estudio te esperan.
          </p>
        </div>

        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink, opacity: 0.7 }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: C.ink, textDecoration: 'underline' }}>
            REGISTRARSE GRATIS →
          </Link>
        </div>

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: C.yellow, border: `4px solid ${C.orange}`, opacity: 0.35 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: 'clamp(40px, 8vw, 56px) clamp(20px, 6vw, 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — CREDENCIALES</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3.5rem)', margin: 0 }}>INICIAR SESIÓN</h1>
          </div>

          {/* Banners */}
          {banner === 'verified' && !resendSent && (
            <Banner bg={C.green} color={C.cream}>CUENTA VERIFICADA. YA PUEDES ACCEDER.</Banner>
          )}
          {banner === 'link_expired' && (
            <Banner bg={C.orange} color={C.cream}>
              EL ENLACE EXPIRÓ. ESCRIBE TU EMAIL Y REENVÍA LA VERIFICACIÓN ABAJO.
            </Banner>
          )}
          {banner === 'error' && (
            <Banner bg={C.pink} color={C.ink}>ERROR DE VERIFICACIÓN. SOLICITA UN NUEVO ENLACE.</Banner>
          )}
          {banner === 'password_reset' && (
            <Banner bg={C.green} color={C.cream}>CONTRASEÑA ACTUALIZADA. INICIA SESIÓN.</Banner>
          )}
          {resendSent && (
            <Banner bg={C.green} color={C.cream}>CORREO REENVIADO. REVISA TU BANDEJA.</Banner>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ background: C.pink, border: inkBorder, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em' }}>
                {error.toUpperCase()}
              </div>
            )}

            <div>
              <label style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" style={inputStyle} />
            </div>

            <div>
              <label style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>CONTRASEÑA</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
            </div>

            <div>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
                onSuccess={t => { setTurnstileToken(t); setTurnstileError(false) }}
                onError={() => { setTurnstileToken(null); setTurnstileError(true) }}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: 'light' }}
              />
              {turnstileError && (
                <div style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', color: C.orange, marginTop: 8 }}>
                  ERROR DE VERIFICACIÓN — RECARGA LA PÁGINA E INTÉNTALO DE NUEVO
                </div>
              )}
              {!turnstileToken && !turnstileError && (
                <div style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', color: C.ink2, marginTop: 8 }}>
                  COMPLETA LA VERIFICACIÓN PARA CONTINUAR
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              style={{
                ...disp, fontSize: 15,
                background: loading || !turnstileToken ? C.ink2 : C.ink,
                color: C.cream,
                border: inkBorder,
                padding: '16px 24px',
                cursor: loading || !turnstileToken ? 'not-allowed' : 'pointer',
                opacity: loading || !turnstileToken ? 0.6 : 1,
              }}
            >
              {loading ? 'ACCEDIENDO...' : 'INICIAR SESIÓN →'}
            </button>

            {/* Resend verification — shown when email not confirmed */}
            {(emailNotConfirmed || banner === 'link_expired' || banner === 'error') && !resendSent && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                style={{
                  ...mono, fontSize: 11, letterSpacing: '0.08em',
                  background: 'transparent',
                  color: C.ink,
                  border: `2px solid ${C.ink2}`,
                  padding: '12px 16px',
                  cursor: resendLoading ? 'not-allowed' : 'pointer',
                  opacity: resendLoading ? 0.5 : 1,
                  textAlign: 'center' as const,
                }}
              >
                {resendLoading ? 'ENVIANDO...' : 'REENVIAR EMAIL DE VERIFICACIÓN'}
              </button>
            )}
          </form>

          {/* ── RECOVERY SECTION ─────────────────────────────────── */}
          <div style={{ marginTop: 32, borderTop: `2px solid ${C.cream2}`, paddingTop: 24 }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink2, marginBottom: 14 }}>
              ¿PROBLEMAS PARA ACCEDER?
            </div>
            <Link
              href="/forgot-password"
              style={{
                ...disp, fontSize: 14,
                display: 'block',
                textAlign: 'center',
                border: `4px solid ${C.orange}`,
                background: 'transparent',
                color: C.orange,
                padding: '14px 24px',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              RECUPERAR CONTRASEÑA →
            </Link>
          </div>

          {/* Enlace cruzado — solo movil (el panel izquierdo se oculta) */}
          <div className="md:hidden" style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink2, marginTop: 24, textAlign: 'center' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: C.ink, textDecoration: 'underline' }}>
              REGISTRARSE GRATIS →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
