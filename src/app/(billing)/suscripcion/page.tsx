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
          PRUEBA SIN COSTO
        </div>
        <h1 style={{ ...disp, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: C.ink, margin: 0, marginBottom: 16 }}>
          EMPIEZA GRATIS
        </h1>
        <p style={{ ...bodyFont, fontSize: 16, color: C.ink, opacity: 0.6, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          Prueba toda la plataforma 7 días sin pagar nada. Si te sirve, sigues por $87.000 COP/mes. Cancela cuando quieras.
        </p>
      </div>

      <div style={{ border: inkBorder, background: C.cream, marginBottom: 32 }}>
        {/* Price header */}
        <div style={{ background: C.ink, padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', color: C.cream, opacity: 0.55, marginBottom: 10 }}>
            PRUEBA SIN COMPROMISO
          </div>
          <div style={{ ...disp, fontSize: 'clamp(2.2rem, 6.5vw, 3.6rem)', color: C.cream, lineHeight: 0.95 }}>
            7 DÍAS GRATIS
          </div>
          <div style={{ ...mono, fontSize: 12, letterSpacing: '0.06em', color: C.cream, opacity: 0.7, marginTop: 12 }}>
            LUEGO $87.000 COP / MES
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
            {loading ? 'PROCESANDO...' : 'EMPEZAR 7 DÍAS GRATIS →'}
          </button>

          {error && (
            <div style={{ ...mono, fontSize: 10, color: C.orange, textAlign: 'center', marginTop: 12 }}>
              {error}
            </div>
          )}

          <div style={{ ...mono, fontSize: 9, color: C.ink, opacity: 0.35, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            SIN COBRO HOY · CANCELA CUANDO QUIERAS · PAGO SEGURO VÍA MERCADO PAGO
          </div>
        </div>
      </div>
    </div>
  )
}
