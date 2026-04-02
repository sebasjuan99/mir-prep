'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getScoreLabel } from '@/lib/constants'

interface RespuestaUsuario {
  pregunta_id: string
  respuesta: string
  correcta: boolean
  tiempo_ms: number
}

interface PreguntaData {
  id: string
  numero_mir: number
  enunciado: string
  especialidad: string
  tema: string
  respuesta_correcta: string
}

interface ResultadoProps {
  score: number
  total: number
  respuestas: RespuestaUsuario[]
  preguntas: PreguntaData[]
  onNuevoSimulacro: () => void
  onRepasarErrores: () => void
}

export default function ResultadoSimulacro({
  score,
  total,
  respuestas,
  preguntas,
  onNuevoSimulacro,
  onRepasarErrores,
}: ResultadoProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const porcentaje = Math.round((score / total) * 100)
  const { label, color } = getScoreLabel(porcentaje)

  // Animated counter
  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current++
      setDisplayScore(current)
      if (current >= score) clearInterval(interval)
    }, 80)
    return () => clearInterval(interval)
  }, [score])

  // Get wrong answers with question data
  const errores = respuestas
    .filter(r => !r.correcta)
    .map(r => {
      const pregunta = preguntas.find(p => p.id === r.pregunta_id)
      return { ...r, pregunta }
    })
    .filter(r => r.pregunta)

  // Group by specialty
  const porEspecialidad = new Map<string, { total: number; correctas: number }>()
  for (const r of respuestas) {
    const p = preguntas.find(pg => pg.id === r.pregunta_id)
    if (!p) continue
    const existing = porEspecialidad.get(p.especialidad) || { total: 0, correctas: 0 }
    existing.total++
    if (r.correcta) existing.correctas++
    porEspecialidad.set(p.especialidad, existing)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      {/* Score */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center"
      >
        <div
          className="inline-flex items-center justify-center w-40 h-40 rounded-full mb-6"
          style={{
            background: `conic-gradient(${color} ${porcentaje * 3.6}deg, var(--bg-secondary) 0deg)`,
          }}
        >
          <div
            className="w-32 h-32 rounded-full flex flex-col items-center justify-center"
            style={{ background: 'var(--bg-card)' }}
          >
            <span className="text-4xl font-bold" style={{ color }}>
              {displayScore}/{total}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {porcentaje}%
            </span>
          </div>
        </div>

        <h2 className="font-[var(--font-display)] text-3xl font-bold mb-2" style={{ color }}>
          {label}
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Has acertado {score} de {total} preguntas
        </p>
      </motion.div>

      {/* Breakdown by specialty */}
      {porEspecialidad.size > 0 && (
        <div
          className="p-6 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <h3 className="font-[var(--font-display)] text-lg font-bold mb-4">
            Por especialidad
          </h3>
          <div className="space-y-3">
            {Array.from(porEspecialidad.entries()).map(([esp, data]) => {
              const pct = Math.round((data.correctas / data.total) * 100)
              return (
                <div key={esp}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{esp}</span>
                    <span style={{ color: pct >= 60 ? 'var(--success)' : 'var(--error)' }}>
                      {data.correctas}/{data.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: pct >= 60 ? 'var(--success)' : 'var(--error)' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wrong answers */}
      {errores.length > 0 && (
        <div
          className="p-6 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <h3 className="font-[var(--font-display)] text-lg font-bold mb-4">
            Preguntas falladas
          </h3>
          <div className="space-y-2">
            {errores.map((e, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-lg text-sm"
                style={{ background: 'var(--error-light)' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">MIR #{e.pregunta!.numero_mir}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {e.pregunta!.especialidad} — {e.pregunta!.tema}
                    </span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--error)' }}>
                    Tu: {e.respuesta} → Correcta: {e.pregunta!.respuesta_correcta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onNuevoSimulacro}
          className="flex-1 py-3.5 text-white font-semibold rounded-xl transition-all hover:shadow-lg"
          style={{ background: 'var(--accent)' }}
        >
          Nuevo simulacro
        </button>
        {errores.length > 0 && (
          <button
            onClick={onRepasarErrores}
            className="flex-1 py-3.5 font-semibold rounded-xl border-2 transition-all"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            Repasar mis errores
          </button>
        )}
        <Link
          href="/dashboard"
          className="flex-1 py-3.5 text-center font-semibold rounded-xl border transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Ver dashboard
        </Link>
      </div>
    </div>
  )
}
