'use client'

import { useState } from 'react'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'

export interface AiFlashcard {
  id?: string
  pregunta: string
  respuesta: string
  especialidad: string
  tipoExamen: string
  consejo: string
}

interface AiFlipCardProps {
  card: AiFlashcard
  onDelete?: (id: string) => void
}

export default function AiFlipCard({ card, onDelete }: AiFlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  const W = 420
  const H = 500

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        onClick={() => setFlipped(f => !f)}
        style={{ width: W, height: H, cursor: 'pointer', perspective: 1200, position: 'relative', maxWidth: '90vw' }}
      >
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* FRONT */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            border: `3px solid ${C.ink}`, background: C.cream,
            padding: '32px 36px', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', boxSizing: 'border-box',
          }}>
            <div>
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', color: C.ink, opacity: 0.5, marginBottom: 8 }}>
                {card.especialidad.toUpperCase()} · {card.tipoExamen}
              </div>
              <div style={{ width: 32, height: 3, background: '#E84A1F', marginBottom: 24 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ ...bodyFont, fontSize: 20, fontWeight: 700, color: C.ink, lineHeight: 1.5 }}>
                {card.pregunta}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: C.ink, opacity: 0.4 }}>PREGUNTA</div>
              <div style={{ fontSize: 24, color: C.ink, opacity: 0.1 }}>✦</div>
            </div>
          </div>

          {/* BACK */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            border: `3px solid ${C.ink}`, background: C.ink,
            padding: '32px 36px', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', boxSizing: 'border-box',
          }}>
            <div>
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', color: C.cream, opacity: 0.5, marginBottom: 8 }}>
                {card.especialidad.toUpperCase()} · {card.tipoExamen}
              </div>
              <div style={{ width: 32, height: 3, background: '#E84A1F', marginBottom: 24 }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ ...bodyFont, fontSize: 17, color: C.cream, lineHeight: 1.6 }}>
                {card.respuesta}
              </div>
            </div>
            <div>
              <div style={{ borderTop: `1px solid rgba(245,240,232,0.15)`, paddingTop: 12, marginTop: 16 }}>
                <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', color: C.cream, opacity: 0.45, marginBottom: 6 }}>CONSEJO</div>
                <div style={{ ...bodyFont, fontSize: 13, color: C.cream, opacity: 0.75, lineHeight: 1.5 }}>
                  {card.consejo}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', color: C.cream, opacity: 0.35 }}>RESPUESTA</div>
                <div style={{ fontSize: 20, color: C.cream, opacity: 0.1 }}>✦</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...mono, fontSize: 9, letterSpacing: '0.08em', color: C.ink, opacity: 0.4 }}>
        {flipped ? 'click para volver a la pregunta' : 'click para ver respuesta'}
      </div>

      {onDelete && card.id && (
        <button
          onClick={() => onDelete(card.id!)}
          style={{
            ...mono, fontSize: 9, letterSpacing: '0.08em',
            background: 'transparent', border: inkBorder,
            color: C.ink, padding: '5px 12px', cursor: 'pointer', opacity: 0.5,
          }}
        >
          ELIMINAR
        </button>
      )}
    </div>
  )
}
