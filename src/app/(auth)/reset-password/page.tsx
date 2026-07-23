'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
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
      <div className="auth-panel-left" style={{ background: G.brandVivid, padding: '56px 52px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textDecoration: 'none' }}>
            <Image src="/revive-icon-blanco.png" alt="Revive" width={88} height={88} style={{ objectFit: 'contain' }} />
            <span style={{ ...bodyFont, fontWeight: 500, fontSize: 15, color: '#FFFFFF' }}>Próximo Residente</span>
          </Link>
          <span style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 999, padding: '4px 10px', color: '#FFFFFF' }}>NUEVA CLAVE</span>
        </div>

        <div>
          <div style={{ ...kicker('rgba(255,255,255,0.16)', '#FFFFFF'), marginBottom: 28 }}>ÚLTIMO PASO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 4.5vw, 4.5rem)', color: '#FFFFFF', margin: 0, marginBottom: 24 }}>
            Nueva contraseña.
          </h2>
          <p style={{ ...bodyFont, fontSize: 17, color: 'rgba(255,255,255,0.82)', maxWidth: 340, lineHeight: 1.65 }}>
            Elige una contraseña nueva y segura. Después podrás acceder normalmente.
          </p>
        </div>

        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.75)' }}>
          Próximo Residente — Recuperación de acceso
        </div>

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', opacity: 1 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: '56px 52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — NUEVA CLAVE</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3rem)', margin: 0 }}>Restablecer</h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ background: C.dangerSoft, border: '1px solid #F2C4CA', borderRadius: 12, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em', color: C.danger }}>
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
                background: G.brandVivid,
                color: '#FFFFFF',
                border: '1px solid transparent',
                borderRadius: R.sm,
                boxShadow: S.brand,
                padding: '16px 24px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Guardando...' : 'Guardar contraseña →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
