'use client'

import { useState } from 'react'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'

interface ApiKeyModalProps {
  onClose: () => void
  onSaved: () => void
}

export default function ApiKeyModal({ onClose, onSaved }: ApiKeyModalProps) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(false)

  const handleSave = async () => {
    setError('')
    if (!key.startsWith('sk-ant-')) {
      setError('La API key debe comenzar con sk-ant-')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/user/claude-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
        return
      }
      onSaved()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: C.cream, border: inkBorder,
        padding: '48px 40px', width: '100%', maxWidth: 480,
      }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', marginBottom: 12, opacity: 0.5 }}>
          CONFIGURACIÓN
        </div>
        <h2 style={{ ...disp, fontSize: 28, margin: '0 0 8px' }}>API KEY DE CLAUDE</h2>
        <p style={{ ...bodyFont, fontSize: 14, opacity: 0.7, marginBottom: 28, lineHeight: 1.5 }}>
          Tu key se cifra con AES-256 antes de guardarse. Nunca la vemos en texto plano.
          Obtenla en <strong>console.anthropic.com</strong>.
        </p>

        {error && (
          <div style={{ ...mono, fontSize: 10, background: '#ffd0cc', border: inkBorder, padding: '10px 14px', marginBottom: 16 }}>
            {error.toUpperCase()}
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="sk-ant-api03-..."
            value={key}
            onChange={e => setKey(e.target.value)}
            style={{
              ...bodyFont, width: '100%', padding: '14px 48px 14px 16px',
              border: inkBorder, background: C.cream, color: C.ink,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={() => setShowKey(v => !v)}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: 44, background: 'transparent', border: 'none',
              borderLeft: inkBorder, cursor: 'pointer', color: C.ink2,
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title={showKey ? 'Ocultar' : 'Mostrar'}
          >
            {showKey ? '🙈' : '👁'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={loading || !key}
            style={{
              ...disp, fontSize: 13, flex: 1,
              background: loading ? C.ink2 : C.ink, color: '#FFFFFF', borderRadius: 8,
              border: inkBorder, padding: '14px 20px', cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'GUARDANDO...' : 'GUARDAR →'}
          </button>
          <button
            onClick={onClose}
            style={{
              ...mono, fontSize: 11, background: 'transparent',
              border: inkBorder, color: C.ink, padding: '14px 20px', cursor: 'pointer',
            }}
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  )
}
