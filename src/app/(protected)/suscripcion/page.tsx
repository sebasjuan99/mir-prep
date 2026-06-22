'use client'

import { useState } from 'react'
import { C, disp, mono, bodyFont, inkBorder } from '@/lib/cm'

const FEATURES = [
  'Simulacros ilimitados (MIR, ENARM, UNAL, El Bosque, Rosario, CES)',
  'Más de 3,700 preguntas de residencia',
  'Estadísticas detalladas por especialidad',
  'Ranking por universidad con recomendación personalizada',
  'Repaso inteligente de errores',
  'Flashcards con IA (trae tu propia API key)',
]

export default function SuscripcionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSuscribirse() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/suscripcion/suscribirse', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al procesar')
        setLoading(false)
        return
      }

      window.location.href = data.init_point
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink, opacity: 0.45, marginBottom: 12 }}>
          SUSCRIPCIÓN
        </div>
        <h1 style={{ ...disp, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: C.ink, margin: 0, marginBottom: 16 }}>
          ACTIVA TU ACCESO
        </h1>
        <p style={{ ...bodyFont, fontSize: 16, color: C.ink, opacity: 0.6, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          Prepárate para tu examen de residencia médica con la plataforma más completa de práctica.
        </p>
      </div>

      <div style={{ border: inkBorder, background: C.cream, marginBottom: 32 }}>
        {/* Price header */}
        <div style={{ background: C.ink, padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', color: C.cream, opacity: 0.55, marginBottom: 8 }}>
            PLAN MENSUAL
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
            <span style={{ ...disp, fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: C.cream }}>
              $87.000
            </span>
            <span style={{ ...mono, fontSize: 11, color: C.cream, opacity: 0.5 }}>
              COP / MES
            </span>
          </div>
        </div>

        {/* Features list */}
        <div style={{ padding: '28px 28px 8px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              paddingBottom: 18, marginBottom: 18,
              borderBottom: i < FEATURES.length - 1 ? `2px solid ${C.ink}20` : 'none',
            }}>
              <div style={{
                ...mono, fontSize: 10, flexShrink: 0,
                width: 22, height: 22, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: C.green, color: C.cream, borderRadius: 0,
              }}>
                +
              </div>
              <span style={{ ...bodyFont, fontSize: 14, color: C.ink, lineHeight: 1.5 }}>
                {f}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '0 28px 28px' }}>
          <button
            onClick={handleSuscribirse}
            disabled={loading}
            style={{
              ...disp,
              fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
              width: '100%',
              padding: '20px 24px',
              background: C.green,
              color: C.cream,
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'PROCESANDO...' : 'SUSCRIBIRME AHORA'}
          </button>

          {error && (
            <div style={{ ...mono, fontSize: 10, color: C.orange, textAlign: 'center', marginTop: 12 }}>
              {error}
            </div>
          )}

          <div style={{ ...mono, fontSize: 9, color: C.ink, opacity: 0.35, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            PAGO SEGURO VIA MERCADO PAGO — CANCELA CUANDO QUIERAS
          </div>
        </div>
      </div>
    </div>
  )
}
