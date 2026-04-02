'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-md text-center p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="font-[var(--font-display)] text-2xl font-bold mb-3">Revisa tu correo</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Te hemos enviado un enlace de confirmación. Haz clic en él para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 px-6 py-3 text-white font-semibold rounded-lg"
            style={{ background: 'var(--accent)' }}
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">📚</span>
            <span className="font-[var(--font-display)] text-2xl font-bold">MIR Prep</span>
          </Link>
          <h1 className="font-[var(--font-display)] text-3xl font-bold mb-2">Crea tu cuenta</h1>
          <p style={{ color: 'var(--text-muted)' }}>Empieza a preparar el MIR hoy mismo</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-2xl space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          {error && (
            <div className="p-3 rounded-lg text-sm font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="Repite tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ background: loading ? 'var(--text-muted)' : 'var(--accent)' }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
