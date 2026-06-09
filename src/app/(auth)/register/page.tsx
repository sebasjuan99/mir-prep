'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (!turnstileToken) { setError('Completa la verificación de seguridad'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al registrarse'); return }
      setSuccess(true)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ ...bodyFont, background: C.green, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', padding: '80px 40px', position: 'relative', zIndex: 2 }}>
          <div style={{ ...kicker(C.cream, C.ink), marginBottom: 32 }}>CUENTA CREADA</div>
          <h2 style={{ ...disp, fontSize: 'clamp(3rem, 8vw, 9rem)', color: C.cream, margin: 0, marginBottom: 32 }}>
            REVISA TU<br />CORREO.
          </h2>
          <p style={{ ...bodyFont, fontSize: 18, color: C.cream, opacity: 0.85, maxWidth: 460, margin: '0 auto 48px' }}>
            Te hemos enviado un enlace de confirmación. Haz clic en él para activar tu cuenta.
          </p>
          <Link href="/login" style={{ ...disp, fontSize: 18, border: `4px solid ${C.cream}`, background: C.cream, color: C.ink, padding: '16px 36px', textDecoration: 'none' }}>
            IR A INICIAR SESIÓN →
          </Link>
        </div>
        <div style={{ position: 'absolute', right: '8%', top: '20%', width: 160, height: 160, background: C.pink, border: `4px solid ${C.cream}`, transform: 'rotate(-6deg)', display: 'grid', alignItems: 'center', justifyItems: 'center', zIndex: 3 }}>
          <div style={{ width: '82%', height: '82%', border: `4px solid ${C.cream}`, borderRadius: '50%', display: 'grid', alignItems: 'center', justifyItems: 'center', textAlign: 'center' }}>
            <span style={{ ...disp, fontSize: 22, color: C.cream }}>MIR<br />2025</span>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: -60, left: '10%', width: 200, height: 200, borderRadius: '50%', background: C.yellow, border: `4px solid ${C.greenDark}`, opacity: 0.4 }} />
      </div>
    )
  }

  return (
    <div style={{ ...bodyFont, display: 'grid', gridTemplateColumns: '45fr 55fr', minHeight: '100vh' }}>

      {/* LEFT PANEL — green */}
      <div style={{ background: C.green, padding: '56px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/ape-logo-blanco.png" alt="Aurora Pixel Studio" width={30} height={30} style={{ objectFit: 'contain' }} />
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.1em', color: C.cream }}>MIR PREP</span>
          </Link>
          <span style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: `2px solid ${C.cream}`, borderRadius: 999, padding: '4px 10px', color: C.cream }}>REGISTRO</span>
        </div>

        <div>
          <div style={{ ...kicker(C.cream, C.ink), marginBottom: 28 }}>NUEVO RESIDENTE</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 4.5vw, 6rem)', color: C.cream, margin: 0, marginBottom: 24 }}>
            CREA TU<br />CUENTA.
          </h2>
          <p style={{ ...bodyFont, fontSize: 17, color: C.cream, opacity: 0.8, maxWidth: 340, lineHeight: 1.55 }}>
            Prepara el MIR con preguntas reales, fichas de estudio y seguimiento de tu progreso por especialidad.
          </p>
        </div>

        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.cream, opacity: 0.7 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: C.cream, textDecoration: 'underline' }}>
            INICIAR SESIÓN →
          </Link>
        </div>

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: C.yellow, border: `4px solid ${C.greenDark}`, opacity: 0.3, zIndex: 0 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: '56px 52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — DATOS DE ACCESO</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3.5rem)', margin: 0 }}>CREAR CUENTA</h1>
          </div>

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
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" style={inputStyle} />
            </div>

            <div>
              <label style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>CONFIRMAR CONTRASEÑA</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repite tu contraseña" style={inputStyle} />
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
              {loading ? 'CREANDO...' : 'CREAR CUENTA →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
