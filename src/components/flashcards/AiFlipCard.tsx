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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          width: 180,
          height: 320,
          cursor: 'pointer',
          perspective: 800,
          position: 'relative',
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* FRONT */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            border: `3px solid ${C.ink}`,
            background: C.cream,
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <div>
              <div style={{ ...mono, fontSize: 8, letterSpacing: '0.14em', color: C.ink, opacity: 0.5, marginBottom: 6 }}>
                {card.especialidad.toUpperCase()} · {card.tipoExamen}
              </div>
              <div style={{ width: 24, height: 3, background: '#E84A1F', marginBottom: 16 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ ...bodyFont, fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>
                {card.pregunta}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ ...mono, fontSize: 8, letterSpacing: '0.1em', color: C.ink, opacity: 0.4 }}>PREGUNTA</div>
              <div style={{ fontSize: 18, color: C.ink, opacity: 0.12 }}>✦</div>
            </div>
          </div>

          {/* BACK */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            border: `3px solid ${C.ink}`,
            background: C.ink,
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <div>
              <div style={{ ...mono, fontSize: 8, letterSpacing: '0.14em', color: C.cream, opacity: 0.5, marginBottom: 6 }}>
                {card.especialidad.toUpperCase()} · {card.tipoExamen}
              </div>
              <div style={{ width: 24, height: 3, background: '#E84A1F', marginBottom: 16 }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ ...bodyFont, fontSize: 11.5, color: C.cream, lineHeight: 1.5 }}>
                {card.respuesta}
              </div>
            </div>
            <div>
              <div style={{ borderTop: `1px solid rgba(245,240,232,0.15)`, paddingTop: 8, marginBottom: 4 }}>
                <div style={{ ...mono, fontSize: 7, letterSpacing: '0.1em', color: C.cream, opacity: 0.45, marginBottom: 3 }}>CONSEJO</div>
                <div style={{ ...bodyFont, fontSize: 9.5, color: C.cream, opacity: 0.7, lineHeight: 1.35 }}>
                  {card.consejo}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div style={{ ...mono, fontSize: 7, letterSpacing: '0.1em', color: C.cream, opacity: 0.35 }}>RESPUESTA</div>
                <div style={{ fontSize: 16, color: C.cream, opacity: 0.1 }}>✦</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...mono, fontSize: 8, letterSpacing: '0.08em', color: C.ink, opacity: 0.35 }}>
        {flipped ? 'click para volver' : 'click para ver respuesta'}
      </div>

      {onDelete && card.id && (
        <button
          onClick={() => onDelete(card.id!)}
          style={{
            ...mono, fontSize: 9, letterSpacing: '0.08em',
            background: 'transparent', border: inkBorder,
            color: C.ink, padding: '4px 10px', cursor: 'pointer', opacity: 0.5,
          }}
        >
          ELIMINAR
        </button>
      )}
    </div>
  )
}
