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

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('verified') === 'true') setVerified(true)
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

  return (
    <div style={{ ...bodyFont, display: 'grid', gridTemplateColumns: '45fr 55fr', minHeight: '100vh' }}>

      {/* LEFT PANEL — pink */}
      <div style={{ background: C.pink, padding: '56px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/ape-logo-negro.png" alt="Aurora Pixel Studio" width={30} height={30} style={{ objectFit: 'contain' }} />
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.1em', color: C.ink }}>MIR PREP</span>
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

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: C.yellow, border: `4px solid ${C.orange}`, opacity: 0.35, zIndex: 0 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: '56px 52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — CREDENCIALES</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3.5rem)', margin: 0 }}>INICIAR SESIÓN</h1>
          </div>

          {verified && (
            <div style={{ background: C.green, border: inkBorder, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em', color: C.cream, marginBottom: 20 }}>
              CUENTA VERIFICADA. YA PUEDES ACCEDER.
            </div>
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
                onSuccess={t => setTurnstileToken(t)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: 'light' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              style={{
                ...disp,
                fontSize: 15,
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
          </form>
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
