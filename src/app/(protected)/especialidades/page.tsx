'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { C, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'

interface Especialidad {
  nombre: string
  totalPreguntas: number
  respondidas: number
  correctas: number
  porcentaje: number | null
}

export default function EspecialidadesPage() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/especialidades')
      .then(r => r.json())
      .then(data => { setEspecialidades(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ height: 48, background: C.cream2, border: inkBorder, width: 280 }} />
        <div className="grid-4col" style={{ gap: 0, border: inkBorder }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 140, borderRight: i % 4 < 3 ? inkBorder : undefined, borderBottom: inkBorder }} className="skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header */}
      <div style={{ borderBottom: inkBorder, paddingBottom: 32, marginBottom: 48 }}>
        <div style={{ ...kicker(), marginBottom: 16 }}>CATÁLOGO MIR</div>
        <h1 style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 4.5rem)', margin: 0 }}>ESPECIALIDADES</h1>
      </div>

      {/* Stat row */}
      <div className="grid-stats" style={{ border: inkBorder, marginBottom: 48 }}>
        <div style={{ background: C.green, color: C.cream, borderRight: inkBorder, padding: '28px 28px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 4.5rem)', lineHeight: 0.88 }}>{especialidades.length}</div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', marginTop: 10 }}>ESPECIALIDADES</div>
        </div>
        <div style={{ background: C.pink, color: C.ink, borderRight: inkBorder, padding: '28px 28px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 4.5rem)', lineHeight: 0.88 }}>
            {especialidades.reduce((s, e) => s + e.totalPreguntas, 0)}
          </div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', marginTop: 10 }}>PREGUNTAS TOTALES</div>
        </div>
        <div style={{ background: C.orange, color: C.cream, padding: '28px 28px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 4.5rem)', lineHeight: 0.88 }}>
            {especialidades.filter(e => e.porcentaje !== null).length}
          </div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', marginTop: 10 }}>CON PROGRESO</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ ...mono, fontSize: 11, letterSpacing: '0.14em', background: C.ink, color: C.cream, padding: '6px 12px', display: 'inline-block', marginBottom: 24 }}>
        ELIGE UNA ESPECIALIDAD
      </div>
      <div className="grid-4col" style={{ border: inkBorder }}>
        {especialidades.map((esp, i) => {
          const hasProgress = esp.porcentaje !== null
          const pct = esp.porcentaje ?? 0
          const col = i % 4

          let bgColor: string = C.cream2
          if (hasProgress && pct >= 80) bgColor = C.green
          else if (hasProgress && pct < 50) bgColor = C.pink

          const textColor = bgColor === C.green ? C.cream : C.ink

          return (
            <Link
              key={esp.nombre}
              href={`/simulacro?especialidad=${encodeURIComponent(esp.nombre)}&tipo=especialidad`}
              style={{
                ...bodyFont,
                display: 'block',
                padding: '24px 20px',
                background: bgColor,
                color: textColor,
                textDecoration: 'none',
                borderRight: col < 3 ? inkBorder : undefined,
                borderBottom: i < especialidades.length - (especialidades.length % 4 || 4) ? inkBorder : undefined,
                minHeight: 120,
              }}
            >
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', opacity: 0.6, marginBottom: 8 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ ...disp, fontSize: 'clamp(0.85rem, 1.2vw, 1.1rem)', marginBottom: 8, lineHeight: 1.1 }}>
                {esp.nombre}
              </div>
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.06em', opacity: 0.7 }}>
                {esp.totalPreguntas} PREGUNTAS
              </div>
              {hasProgress && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 4, background: textColor === C.cream ? 'rgba(239,233,217,0.3)' : C.cream, border: `1px solid currentColor` }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: textColor === C.cream ? C.cream : C.ink }} />
                  </div>
                  <div style={{ ...mono, fontSize: 9, letterSpacing: '0.06em', marginTop: 4 }}>
                    {pct}% ACIERTOS
                  </div>
                </div>
              )}
            </Link>
          )
        })}
      </div>

    </div>
  )
}
