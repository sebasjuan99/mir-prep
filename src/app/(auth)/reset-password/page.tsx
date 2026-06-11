'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verify there is an active recovery session before showing the form
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/forgot-password')
      } else {
        setReady(true)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await supabase.auth.signOut()
    router.push('/login?password_reset=true')
  }

  if (!ready) {
    return (
      <div style={{ ...bodyFont, background: C.cream, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ ...mono, fontSize: 13, letterSpacing: '0.1em', color: C.ink2 }}>CARGANDO...</span>
      </div>
    )
  }

  return (
    <div className="auth-grid" style={{ ...bodyFont }}>

      {/* LEFT PANEL — yellow */}
      <div className="auth-panel-left" style={{ background: C.yellow, padding: '56px 52px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textDecoration: 'none' }}>
            <Image src="/ape-logo-negro.png" alt="Aurora Pixel Studio" width={88} height={88} style={{ objectFit: 'contain' }} />
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.14em', color: C.ink }}>MIR PREP</span>
          </Link>
          <span style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: `2px solid ${C.ink}`, borderRadius: 999, padding: '4px 10px', color: C.ink }}>NUEVA CLAVE</span>
        </div>

        <div>
          <div style={{ ...kicker(), marginBottom: 28 }}>ÚLTIMO PASO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 4.5vw, 6rem)', color: C.ink, margin: 0, marginBottom: 24 }}>
            NUEVA<br />CONTRASEÑA.
          </h2>
          <p style={{ ...bodyFont, fontSize: 17, color: C.ink, opacity: 0.75, maxWidth: 340, lineHeight: 1.55 }}>
            Elige una contraseña nueva y segura. Después podrás acceder normalmente.
          </p>
        </div>

        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink, opacity: 0.6 }}>
          MIR PREP — Recuperación de acceso
        </div>

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: C.orange, border: `4px solid ${C.ink}`, opacity: 0.2 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: '56px 52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — NUEVA CLAVE</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3.5rem)', margin: 0 }}>RESTABLECER</h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ background: C.pink, border: inkBorder, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em' }}>
                {error.toUpperCase()}
              </div>
            )}

            <div>
              <label style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>NUEVA CONTRASEÑA</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" style={inputStyle} />
            </div>

            <div>
              <label style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>CONFIRMAR CONTRASEÑA</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repite tu contraseña" style={inputStyle} />
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
              {loading ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
