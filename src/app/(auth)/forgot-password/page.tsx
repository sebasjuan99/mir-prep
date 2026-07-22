'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { C, G, R, S, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) { setError('Error al enviar el correo.'); return }
      setSent(true)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ ...bodyFont, background: G.brandVivid, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', padding: '80px 40px', position: 'relative', zIndex: 2 }}>
          <div style={{ ...kicker(C.cream, C.ink), marginBottom: 32 }}>CORREO ENVIADO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: '#FFFFFF', margin: 0, marginBottom: 32 }}>
            REVISA TU<br />CORREO.
          </h2>
          <p style={{ ...bodyFont, fontSize: 18, color: C.cream, opacity: 0.85, maxWidth: 460, margin: '0 auto 48px' }}>
            Si ese email tiene cuenta, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link href="/login" style={{ ...bodyFont, fontSize: 15, fontWeight: 600, borderRadius: 8, background: '#FFFFFF', color: C.purpleDeep, padding: '14px 32px', textDecoration: 'none' }}>
            VOLVER AL LOGIN →
          </Link>
        </div>
        <div style={{ position: 'absolute', bottom: -60, left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', opacity: 1 }} />
      </div>
    )
  }

  return (
    <div className="auth-grid" style={{ ...bodyFont }}>

      {/* LEFT PANEL — orange */}
      <div className="auth-panel-left" style={{ background: G.brandVivid, padding: '56px 52px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textDecoration: 'none' }}>
            <Image src="/revive-icon-blanco.png" alt="Revive" width={88} height={88} style={{ objectFit: 'contain' }} />
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.14em', color: '#FFFFFF' }}>Próximo Residente</span>
          </Link>
          <span style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 999, padding: '4px 10px', color: '#FFFFFF' }}>RECUPERAR</span>
        </div>

        <div>
          <div style={{ ...kicker('rgba(255,255,255,0.16)', '#FFFFFF'), marginBottom: 28 }}>ACCESO PERDIDO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 4.5vw, 4.5rem)', color: '#FFFFFF', margin: 0, marginBottom: 24 }}>
            RECUPERA TU<br />CONTRASEÑA.
          </h2>
          <p style={{ ...bodyFont, fontSize: 17, color: 'rgba(255,255,255,0.82)', maxWidth: 340, lineHeight: 1.65 }}>
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.75)' }}>
          ¿Recuerdas tu contraseña?{' '}
          <Link href="/login" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>
            INICIAR SESIÓN →
          </Link>
        </div>

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', opacity: 1 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: '56px 52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — TU EMAIL</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3rem)', margin: 0 }}>Recuperar acceso</h1>
          </div>

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

            <button
              type="submit"
              disabled={loading}
              style={{
                ...disp,
                fontSize: 15,
                background: loading ? C.ink2 : C.ink,
                color: C.cream,
                border: inkBorder,
                padding: '16px 24px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
