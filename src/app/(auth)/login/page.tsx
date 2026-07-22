'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import { C, G, R, S, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'
import { useReviveEmbed } from '@/lib/revive'

const inputStyle = {
  ...bodyFont,
  width: '100%',
  padding: '14px 16px',
  border: inkBorder,
  borderRadius: 8,
  background: C.card,
  color: C.ink,
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box' as const,
}

function Banner({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: inkBorder, borderRadius: 12, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em', color, marginBottom: 20 }}>
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
  // Oculta el registro cuando la app llega embebida desde Revive (sus usuarios
  // ya tienen cuenta). Los usuarios externos directos no se ven afectados.
  const isReviveEmbed = useReviveEmbed()

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
      <div className="auth-panel-left" style={{ background: G.brandVivid, padding: '56px 52px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textDecoration: 'none' }}>
            <Image src="/revive-icon-blanco.png" alt="Revive" width={88} height={88} style={{ objectFit: 'contain' }} />
            <span style={{ ...bodyFont, fontWeight: 500, fontSize: 15, color: '#FFFFFF' }}>Próximo Residente</span>
          </Link>
          <span style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 999, padding: '4px 10px', color: '#FFFFFF' }}>ACCESO</span>
        </div>

        <div>
          <div style={{ ...kicker('rgba(255,255,255,0.16)', '#FFFFFF'), marginBottom: 28 }}>RESIDENTE VERIFICADO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 4.5vw, 4.5rem)', color: '#FFFFFF', margin: 0, marginBottom: 24 }}>
            Bienvenido de vuelta.
          </h2>
          <p style={{ ...bodyFont, fontSize: 17, color: 'rgba(255,255,255,0.82)', maxWidth: 340, lineHeight: 1.65 }}>
            Continúa donde lo dejaste. Tu progreso y tus fichas de estudio te esperan.
          </p>
        </div>

        {!isReviveEmbed && (
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.75)' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>
              REGISTRARSE GRATIS →
            </Link>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', opacity: 1 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: 'clamp(40px, 8vw, 56px) clamp(20px, 6vw, 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — CREDENCIALES</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3rem)', margin: 0 }}>Iniciar sesión</h1>
          </div>

          {/* Banners */}
          {banner === 'verified' && !resendSent && (
            <Banner bg={C.greenSoft} color={C.greenDark}>CUENTA VERIFICADA. YA PUEDES ACCEDER.</Banner>
          )}
          {banner === 'link_expired' && (
            <Banner bg={C.warningSoft} color="#9A6212">
              EL ENLACE EXPIRÓ. ESCRIBE TU EMAIL Y REENVÍA LA VERIFICACIÓN ABAJO.
            </Banner>
          )}
          {banner === 'error' && (
            <Banner bg={C.dangerSoft} color={C.danger}>ERROR DE VERIFICACIÓN. SOLICITA UN NUEVO ENLACE.</Banner>
          )}
          {banner === 'password_reset' && (
            <Banner bg={C.greenSoft} color={C.greenDark}>CONTRASEÑA ACTUALIZADA. INICIA SESIÓN.</Banner>
          )}
          {resendSent && (
            <Banner bg={C.greenSoft} color={C.greenDark}>CORREO REENVIADO. REVISA TU BANDEJA.</Banner>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ background: C.dangerSoft, border: '1px solid #F2C4CA', borderRadius: 12, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em', color: C.danger }}>
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
                <div style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', color: C.danger, marginTop: 8 }}>
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
                ...bodyFont, fontSize: 16, fontWeight: 600,
                background: G.brandVivid,
                color: '#FFFFFF',
                border: '1px solid transparent',
                borderRadius: R.sm,
                boxShadow: S.brand,
                padding: '16px 24px',
                cursor: loading || !turnstileToken ? 'not-allowed' : 'pointer',
                opacity: loading || !turnstileToken ? 0.5 : 1,
              }}
            >
              {loading ? 'Accediendo...' : 'Iniciar sesión →'}
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
                  color: C.ink2,
                  border: inkBorder,
                  borderRadius: R.sm,
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
          <div style={{ marginTop: 32, borderTop: inkBorder, paddingTop: 24 }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink2, marginBottom: 14 }}>
              ¿PROBLEMAS PARA ACCEDER?
            </div>
            <Link
              href="/forgot-password"
              style={{
                ...bodyFont, fontSize: 14, fontWeight: 500,
                display: 'block',
                textAlign: 'center',
                border: `1px solid ${C.purple}`,
                borderRadius: R.sm,
                background: 'transparent',
                color: C.purple,
                padding: '14px 24px',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              Recuperar contraseña →
            </Link>
          </div>

          {/* Enlace cruzado — solo movil (el panel izquierdo se oculta) */}
          {!isReviveEmbed && (
            <div className="md:hidden" style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink2, marginTop: 24, textAlign: 'center' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/register" style={{ color: C.purple, textDecoration: 'underline' }}>
                REGISTRARSE GRATIS →
              </Link>
            </div>
          )}
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
