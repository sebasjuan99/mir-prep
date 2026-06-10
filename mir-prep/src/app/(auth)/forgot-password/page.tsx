'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
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
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectTo = `${appUrl}/auth/callback?next=/reset-password`
      console.log('[forgot-password] redirectTo:', redirectTo)
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (sbError) {
        console.error('[forgot-password] Supabase error:', sbError.message, sbError)
        setError(`Error: ${sbError.message}`)
        return
      }
      setSent(true)
    } catch (err) {
      console.error('[forgot-password] Exception:', err)
      setError(`Error de conexión: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ ...bodyFont, background: C.green, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', padding: '80px 40px', position: 'relative', zIndex: 2 }}>
          <div style={{ ...kicker(C.cream, C.ink), marginBottom: 32 }}>CORREO ENVIADO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(3rem, 7vw, 8rem)', color: C.cream, margin: 0, marginBottom: 32 }}>
            REVISA TU<br />CORREO.
          </h2>
          <p style={{ ...bodyFont, fontSize: 18, color: C.cream, opacity: 0.85, maxWidth: 460, margin: '0 auto 48px' }}>
            Si ese email tiene cuenta, recibirás un enlace para restablecer tu contraseña.
          </p>
          <Link href="/login" style={{ ...disp, fontSize: 16, border: `4px solid ${C.cream}`, background: C.cream, color: C.ink, padding: '14px 32px', textDecoration: 'none' }}>
            VOLVER AL LOGIN →
          </Link>
        </div>
        <div style={{ position: 'absolute', bottom: -60, left: '10%', width: 200, height: 200, borderRadius: '50%', background: C.yellow, border: `4px solid ${C.greenDark}`, opacity: 0.35 }} />
      </div>
    )
  }

  return (
    <div style={{ ...bodyFont, display: 'grid', gridTemplateColumns: '45fr 55fr', minHeight: '100vh' }}>

      {/* LEFT PANEL — orange */}
      <div style={{ background: C.orange, padding: '56px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textDecoration: 'none' }}>
            <Image src="/ape-logo-blanco.png" alt="Aurora Pixel Studio" width={88} height={88} style={{ objectFit: 'contain' }} />
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.14em', color: C.cream }}>MIR PREP</span>
          </Link>
          <span style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: `2px solid ${C.cream}`, borderRadius: 999, padding: '4px 10px', color: C.cream }}>RECUPERAR</span>
        </div>

        <div>
          <div style={{ ...kicker(C.cream, C.ink), marginBottom: 28 }}>ACCESO PERDIDO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 4.5vw, 6rem)', color: C.cream, margin: 0, marginBottom: 24 }}>
            RECUPERA TU<br />CONTRASEÑA.
          </h2>
          <p style={{ ...bodyFont, fontSize: 17, color: C.cream, opacity: 0.8, maxWidth: 340, lineHeight: 1.55 }}>
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.cream, opacity: 0.7 }}>
          ¿Recuerdas tu contraseña?{' '}
          <Link href="/login" style={{ color: C.cream, textDecoration: 'underline' }}>
            INICIAR SESIÓN →
          </Link>
        </div>

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: C.yellow, border: `4px solid ${C.ink}`, opacity: 0.25 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: '56px 52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — TU EMAIL</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3.5rem)', margin: 0 }}>RECUPERAR ACCESO</h1>
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
