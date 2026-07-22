'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { C, G, R, disp, mono, bodyFont, kicker, inkBorder, card } from '@/lib/cm'

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
        <div style={{ height: 48, background: C.cream2, borderRadius: R.md, width: 280 }} />
        <div className="grid-4col" style={{ gap: 0, ...card, overflow: 'hidden' }}>
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
        <h1 style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 3.6rem)', margin: 0 }}>Especialidades</h1>
      </div>

      {/* Stat row */}
      <div className="grid-stats" style={{ ...card, overflow: 'hidden', marginBottom: 48 }}>
        <div style={{ background: G.brandVivid, color: '#FFFFFF', padding: '28px 28px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 3.6rem)', lineHeight: 1 }}>{especialidades.length}</div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', marginTop: 10 }}>ESPECIALIDADES</div>
        </div>
        <div style={{ background: C.purpleSoft, color: C.purpleDeep, borderRight: inkBorder, borderLeft: inkBorder, padding: '28px 28px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 3.6rem)', lineHeight: 1 }}>
            {especialidades.reduce((s, e) => s + e.totalPreguntas, 0)}
          </div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', marginTop: 10 }}>PREGUNTAS TOTALES</div>
        </div>
        <div style={{ background: C.pinkSoft, color: '#9B2461', padding: '28px 28px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 3.6rem)', lineHeight: 1 }}>
            {especialidades.filter(e => e.porcentaje !== null).length}
          </div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', marginTop: 10 }}>CON PROGRESO</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ ...kicker(), marginBottom: 24 }}>
        ELIGE UNA ESPECIALIDAD
      </div>
      <div className="grid-4col" style={{ ...card, overflow: 'hidden' }}>
        {especialidades.map((esp, i) => {
          const hasProgress = esp.porcentaje !== null
          const pct = esp.porcentaje ?? 0
          const col = i % 4

          // Sin progreso = neutro. Con progreso, el acento indica cómo va.
          let accent: string = C.lineStrong
          if (hasProgress && pct >= 80) accent = C.green
          else if (hasProgress && pct < 50) accent = C.magenta
          else if (hasProgress) accent = C.purple

          return (
            <Link
              key={esp.nombre}
              href={`/simulacro?especialidad=${encodeURIComponent(esp.nombre)}&tipo=especialidad`}
              style={{
                ...bodyFont,
                display: 'block',
                padding: '24px 20px',
                background: C.card,
                color: C.ink,
                textDecoration: 'none',
                borderRight: col < 3 ? inkBorder : undefined,
                borderBottom: i < especialidades.length - (especialidades.length % 4 || 4) ? inkBorder : undefined,
                minHeight: 120,
              }}
            >
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', color: accent, marginBottom: 8 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ ...disp, fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)', marginBottom: 8 }}>
                {esp.nombre}
              </div>
              <div style={{ ...mono, fontSize: 10, letterSpacing: '0.06em', color: C.ink2 }}>
                {esp.totalPreguntas} PREGUNTAS
              </div>
              {hasProgress && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 5, background: C.cream2, borderRadius: R.pill, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: R.pill, background: accent }} />
                  </div>
                  <div style={{ ...mono, fontSize: 9, letterSpacing: '0.06em', marginTop: 6, color: accent }}>
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
