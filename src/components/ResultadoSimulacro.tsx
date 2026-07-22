'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { C, G, R, S, mono, disp, bodyFont, inkBorder, card } from '@/lib/cm'
import { getScoreLabel } from '@/lib/constants'

interface RespuestaUsuario {
  pregunta_id: string
  respuesta: string
  correcta: boolean
  tiempo_ms: number
}

interface PreguntaData {
  id: string
  numero_mir: number | null
  enunciado: string
  especialidad: string
  tema: string
  respuesta_correcta: string
  universidad: string | null
}

interface ResultadoProps {
  score: number
  total: number
  respuestas: RespuestaUsuario[]
  preguntas: PreguntaData[]
  tiempoTotalMs?: number | null
  onNuevoSimulacro: () => void
  onRepasarErrores: () => void
}

function formatTiempo(ms: number): string {
  const totalSeg = Math.round(ms / 1000)
  const min = Math.floor(totalSeg / 60)
  const seg = totalSeg % 60
  if (min === 0) return `${seg}s`
  return `${min}m ${seg.toString().padStart(2, '0')}s`
}

export default function ResultadoSimulacro({
  score,
  total,
  respuestas,
  preguntas,
  tiempoTotalMs,
  onNuevoSimulacro,
  onRepasarErrores,
}: ResultadoProps) {
  // Tiempo: usa el valor de la BD (cubre simulacros reanudados) o suma local de respaldo.
  const tiempoMs = (tiempoTotalMs ?? null) !== null
    ? (tiempoTotalMs as number)
    : respuestas.reduce((s, r) => s + (r.tiempo_ms || 0), 0)
  const [displayScore, setDisplayScore] = useState(0)
  const porcentaje = Math.round((score / total) * 100)
  const { label } = getScoreLabel(porcentaje)

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current++
      setDisplayScore(current)
      if (current >= score) clearInterval(interval)
    }, 80)
    return () => clearInterval(interval)
  }, [score])

  const porEspecialidad = new Map<string, { total: number; correctas: number }>()
  for (const r of respuestas) {
    const p = preguntas.find(pg => pg.id === r.pregunta_id)
    if (!p) continue
    const existing = porEspecialidad.get(p.especialidad) || { total: 0, correctas: 0 }
    existing.total++
    if (r.correcta) existing.correctas++
    porEspecialidad.set(p.especialidad, existing)
  }

  const errores = respuestas
    .filter(r => !r.correcta)
    .map(r => ({ ...r, pregunta: preguntas.find(p => p.id === r.pregunta_id) }))
    .filter(r => r.pregunta)

  // El bloque de puntuación siempre va oscuro; el color comunica el tramo.
  const scoreBg = porcentaje >= 70 ? C.greenDark : porcentaje >= 50 ? G.brandVivid : C.magenta
  const scoreTextColor = '#FFFFFF'

  const espEntries = Array.from(porEspecialidad.entries())

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Score stat cell */}
      <div style={{ borderRadius: R.lg, background: scoreBg, boxShadow: S.lg, padding: '44px 36px', textAlign: 'center' }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', color: scoreTextColor, opacity: 0.72, marginBottom: 10 }}>
          RESULTADO FINAL
        </div>
        <div style={{ ...disp, fontSize: 'clamp(4rem, 14vw, 6rem)', color: scoreTextColor, lineHeight: 1, marginBottom: 14 }}>
          {displayScore}/{total}
        </div>
        <div style={{ ...mono, fontSize: 12, letterSpacing: '0.12em', color: scoreTextColor }}>
          {porcentaje}% &mdash; {label.toUpperCase()}
        </div>
        {tiempoMs > 0 && (
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: scoreTextColor, opacity: 0.7, marginTop: 10 }}>
            TIEMPO: {formatTiempo(tiempoMs)}
          </div>
        )}
      </div>

      {/* Specialty breakdown */}
      {espEntries.length > 0 && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', padding: '13px 16px', background: C.cream2, color: C.ink2, borderBottom: inkBorder }}>
            POR ESPECIALIDAD
          </div>
          {espEntries.map(([esp, data], i) => {
            const pct = Math.round((data.correctas / data.total) * 100)
            return (
              <div
                key={esp}
                style={{
                  padding: '13px 16px',
                  borderTop: i === 0 ? 'none' : inkBorder,
                  background: C.card,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ ...bodyFont, fontSize: 14, fontWeight: 600, color: C.ink }}>{esp}</span>
                  <span style={{ ...mono, fontSize: 10, letterSpacing: '0.06em', color: pct >= 60 ? C.greenDark : C.magenta }}>
                    {data.correctas}/{data.total}
                  </span>
                </div>
                <div style={{ height: 6, background: C.cream2, borderRadius: R.pill, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: R.pill, background: pct >= 60 ? C.green : C.magenta, transition: 'width 0.6s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Wrong answers */}
      {errores.length > 0 && (
        <div style={{ border: inkBorder }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', padding: '11px 16px', background: C.ink, color: C.cream }}>
            PREGUNTAS FALLADAS — {errores.length}
          </div>
          {errores.map((e, i) => (
            <div
              key={i}
              style={{
                padding: '11px 16px', borderTop: `3px solid ${C.ink}`, background: C.cream,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                flexWrap: 'wrap', gap: 6,
              }}
            >
              <div>
                <span style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', color: C.ink }}>
                {e.pregunta!.numero_mir != null
                  ? `MIR #${e.pregunta!.numero_mir}`
                  : (e.pregunta!.universidad || 'PREGUNTA')}
              </span>
                <span style={{ ...mono, fontSize: 9, letterSpacing: '0.06em', color: C.ink, opacity: 0.45, marginLeft: 10 }}>
                  {e.pregunta!.especialidad} — {e.pregunta!.tema}
                </span>
              </div>
              <span style={{ ...mono, fontSize: 9, letterSpacing: '0.06em', color: C.danger }}>
                TU: {e.respuesta} → CORRECTA: {e.pregunta!.respuesta_correcta}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={onNuevoSimulacro}
          style={{
            ...mono, fontSize: 11, letterSpacing: '0.08em', flex: 1, minWidth: 160,
            padding: '14px 20px', background: C.ink, color: C.cream,
            border: inkBorder, cursor: 'pointer',
          }}
        >
          NUEVO SIMULACRO
        </button>
        {errores.length > 0 && (
          <button
            onClick={onRepasarErrores}
            style={{
              ...mono, fontSize: 11, letterSpacing: '0.08em', flex: 1, minWidth: 160,
              padding: '14px 20px', background: 'transparent', color: C.ink,
              border: inkBorder, cursor: 'pointer',
            }}
          >
            REPASAR ERRORES
          </button>
        )}
        <Link
          href="/dashboard"
          style={{
            ...mono, fontSize: 11, letterSpacing: '0.08em', flex: 1, minWidth: 160,
            padding: '14px 20px', background: 'transparent', color: C.ink,
            border: inkBorder, textDecoration: 'none', textAlign: 'center',
            display: 'block', boxSizing: 'border-box',
          }}
        >
          VER DASHBOARD
        </Link>
      </div>
    </div>
  )
}
