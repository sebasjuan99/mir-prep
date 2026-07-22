'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Turnstile } from '@marsidev/react-turnstile'
import { C, G, R, S, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, trackMetaEvent } from '@/lib/analytics'

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

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Confirmación por código de 6 dígitos
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

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
      setStep('code')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setCodeError('')
    const token = code.trim()
    if (token.length < 6) { setCodeError('Ingresa el código de 6 dígitos'); return }

    setVerifying(true)
    try {
      const supabase = createClient()
      // El tipo del OTP de alta puede ser 'signup' o 'email' según la versión;
      // probamos ambos para garantizar la verificación. El token solo se consume
      // cuando coincide, así que el primer intento fallido no lo invalida.
      let { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })
      if (error) {
        const retry = await supabase.auth.verifyOtp({ email, token, type: 'email' })
        error = retry.error
      }
      if (error) {
        setCodeError('Código incorrecto o expirado. Revisa e inténtalo de nuevo.')
        return
      }
      // Registro confirmado con éxito → evento de conversión.
      trackEvent('sign_up', { method: 'email' })
      trackMetaEvent('CompleteRegistration', { content_name: 'registro' })
      // Sesión creada: recargamos para que el servidor reconozca la sesión.
      window.location.href = '/dashboard'
    } catch {
      setCodeError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setCodeError('')
    setResent(false)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setResent(true)
      else setCodeError('No se pudo reenviar el código.')
    } catch {
      setCodeError('Error de conexión.')
    } finally {
      setResending(false)
    }
  }

  if (step === 'code') {
    return (
      <div style={{ ...bodyFont, background: G.brandVivid, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', padding: '64px 40px', position: 'relative', zIndex: 2, width: '100%', maxWidth: 460 }}>
          <div style={{ ...kicker(C.cream, C.ink), marginBottom: 28 }}>CONFIRMA TU CUENTA</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 7vw, 4.2rem)', color: '#FFFFFF', margin: 0, marginBottom: 20 }}>
            REVISA TU<br />CORREO.
          </h2>
          <p style={{ ...bodyFont, fontSize: 16, color: C.cream, opacity: 0.85, margin: '0 auto 32px', lineHeight: 1.55 }}>
            Te enviamos un <b>código de confirmación</b> a<br /><b>{email}</b>. Escríbelo aquí para activar tu cuenta.
          </p>

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {codeError && (
              <div style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em', color: '#FFFFFF' }}>
                {codeError.toUpperCase()}
              </div>
            )}
            {resent && !codeError && (
              <div style={{ background: '#FFFFFF', border: '1px solid #FFFFFF', borderRadius: 12, padding: '12px 16px', ...mono, fontSize: 11, letterSpacing: '0.06em', color: C.ink }}>
                CÓDIGO REENVIADO. REVISA TU CORREO.
              </div>
            )}

            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••••"
              style={{
                ...disp, textAlign: 'center', letterSpacing: '0.3em',
                fontSize: 34, padding: '16px', width: '100%',
                border: '1px solid #FFFFFF', borderRadius: 8, background: '#FFFFFF', color: C.purpleDeep,
                boxSizing: 'border-box', outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={verifying || code.length < 6}
              style={{
                ...bodyFont, fontSize: 16, fontWeight: 600,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.45)',
                background: verifying || code.length < 6 ? 'transparent' : C.cream,
                color: verifying || code.length < 6 ? C.cream : C.ink,
                padding: '16px 36px',
                cursor: verifying || code.length < 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {verifying ? 'VERIFICANDO...' : 'CONFIRMAR Y ENTRAR →'}
            </button>
          </form>

          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.06em', color: C.cream, opacity: 0.85, marginTop: 24 }}>
            ¿No te llegó?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ ...mono, fontSize: 11, letterSpacing: '0.06em', color: C.cream, background: 'transparent', border: 'none', textDecoration: 'underline', cursor: resending ? 'wait' : 'pointer', padding: 0 }}
            >
              {resending ? 'REENVIANDO...' : 'REENVIAR CÓDIGO'}
            </button>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: -60, left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', opacity: 1 }} />
      </div>
    )
  }

  return (
    <div className="auth-grid" style={{ ...bodyFont }}>

      {/* LEFT PANEL — green */}
      <div className="auth-panel-left" style={{ background: G.brandVivid, padding: '56px 52px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: inkBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, textDecoration: 'none' }}>
            <Image src="/revive-icon-blanco.png" alt="Revive" width={88} height={88} style={{ objectFit: 'contain' }} />
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.14em', color: '#FFFFFF' }}>Próximo Residente</span>
          </Link>
          <span style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 999, padding: '4px 10px', color: '#FFFFFF' }}>REGISTRO</span>
        </div>

        <div>
          <div style={{ ...kicker('rgba(255,255,255,0.16)', '#FFFFFF'), marginBottom: 28 }}>NUEVO RESIDENTE</div>
          <h2 style={{ ...disp, fontSize: 'clamp(2.5rem, 4.5vw, 4.5rem)', color: '#FFFFFF', margin: 0, marginBottom: 24 }}>
            CREA TU<br />CUENTA.
          </h2>
          <p style={{ ...bodyFont, fontSize: 17, color: 'rgba(255,255,255,0.82)', maxWidth: 340, lineHeight: 1.65 }}>
            Prepara el MIR con preguntas reales, fichas de estudio y seguimiento de tu progreso por especialidad.
          </p>
        </div>

        <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.75)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>
            INICIAR SESIÓN →
          </Link>
        </div>

        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', opacity: 1, zIndex: 0 }} />
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{ background: C.cream, padding: 'clamp(40px, 8vw, 56px) clamp(20px, 6vw, 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...kicker(), marginBottom: 14 }}>01 — DATOS DE ACCESO</div>
            <h1 style={{ ...disp, fontSize: 'clamp(2rem, 3vw, 3rem)', margin: 0 }}>Crear cuenta</h1>
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

          {/* Enlace cruzado — solo movil (el panel izquierdo se oculta) */}
          <div className="md:hidden" style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink2, marginTop: 28, textAlign: 'center' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: C.ink, textDecoration: 'underline' }}>
              INICIAR SESIÓN →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
