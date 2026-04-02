'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">📚</span>
            <span className="font-[var(--font-display)] text-2xl font-bold">MIR Prep</span>
          </Link>
          <h1 className="font-[var(--font-display)] text-3xl font-bold mb-2">Bienvenido de vuelta</h1>
          <p style={{ color: 'var(--text-muted)' }}>Inicia sesión para continuar estudiando</p>
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
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Email
            </label>
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
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ background: loading ? 'var(--text-muted)' : 'var(--accent)' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
