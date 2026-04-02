'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Opcion {
  letra: string
  texto: string
}

interface PreguntaData {
  id: string
  numero_mir: number
  enunciado: string
  opciones: Opcion[]
  respuesta_correcta: string
  imagen_url: string | null
  especialidad: string
  tema: string
  subtema: string | null
}

interface FlashCardProps {
  pregunta: PreguntaData
  progreso: number
  total: number
  onResponder: (letra: string) => void
  onSiguiente: () => void
  selectedOption: string | null
  showResult: boolean
  resumenTema?: { contenido_md: string; tip_mir?: string | null } | null
}

export default function FlashCard({
  pregunta,
  progreso,
  total,
  onResponder,
  onSiguiente,
  selectedOption,
  showResult,
  resumenTema,
}: FlashCardProps) {
  const [showResumen, setShowResumen] = useState(false)
  const isCorrect = selectedOption === pregunta.respuesta_correcta

  useEffect(() => {
    setShowResumen(false)
  }, [pregunta.id])

  const getOptionClass = (letra: string) => {
    if (!showResult) {
      return selectedOption === letra ? 'option-btn selected' : 'option-btn'
    }
    if (letra === pregunta.respuesta_correcta) return 'option-btn correct'
    if (letra === selectedOption && !isCorrect) return 'option-btn incorrect'
    return 'option-btn opacity-50'
  }

  const getOptionAnimation = (letra: string) => {
    if (!showResult) return {}
    if (letra === pregunta.respuesta_correcta) return { className: 'animate-pulse-success' }
    if (letra === selectedOption && !isCorrect) return { className: 'animate-shake' }
    return {}
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pregunta.id}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-3xl mx-auto"
      >
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Pregunta {progreso} de {total}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              MIR #{pregunta.numero_mir}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(progreso / total) * 100}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          {/* Specialty + Topic chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span
              className="px-3 py-1 text-xs font-semibold rounded-full"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}
            >
              {pregunta.especialidad}
            </span>
            <span
              className="px-3 py-1 text-xs font-semibold rounded-full"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
            >
              {pregunta.tema}
            </span>
            {pregunta.subtema && (
              <span
                className="px-3 py-1 text-xs rounded-full"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
              >
                {pregunta.subtema}
              </span>
            )}
          </div>

          {/* Question text */}
          <p className="font-[var(--font-body)] text-lg md:text-xl leading-relaxed mb-6" style={{ color: 'var(--text-primary)' }}>
            {pregunta.enunciado}
          </p>

          {/* Clinical image */}
          {pregunta.imagen_url && (
            <div className="mb-6 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <img
                src={pregunta.imagen_url}
                alt={`Imagen clínica pregunta ${pregunta.numero_mir}`}
                className="w-full max-h-80 object-contain bg-white"
                loading="lazy"
              />
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 mb-6">
            {pregunta.opciones.map((opcion) => {
              const animProps = getOptionAnimation(opcion.letra)
              return (
                <button
                  key={opcion.letra}
                  onClick={() => !showResult && onResponder(opcion.letra)}
                  disabled={showResult}
                  className={`${getOptionClass(opcion.letra)} ${animProps.className || ''} w-full text-left px-5 py-4 rounded-xl flex items-start gap-3 cursor-pointer disabled:cursor-default`}
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: showResult && opcion.letra === pregunta.respuesta_correcta
                        ? 'var(--success)'
                        : showResult && opcion.letra === selectedOption && !isCorrect
                        ? 'var(--error)'
                        : 'var(--bg-secondary)',
                      color: showResult && (opcion.letra === pregunta.respuesta_correcta || opcion.letra === selectedOption)
                        ? 'white'
                        : 'var(--text-primary)',
                    }}
                  >
                    {showResult && opcion.letra === pregunta.respuesta_correcta
                      ? '✓'
                      : showResult && opcion.letra === selectedOption && !isCorrect
                      ? '✗'
                      : opcion.letra}
                  </span>
                  <span className="font-[var(--font-body)] text-base leading-relaxed pt-1">
                    {opcion.texto}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Result feedback */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {isCorrect ? (
                <div className="p-4 rounded-xl" style={{ background: 'var(--success-light)' }}>
                  <p className="font-semibold" style={{ color: 'var(--success)' }}>
                    ✓ ¡Correcto! Bien hecho 👏
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl" style={{ background: 'var(--error-light)' }}>
                    <p className="font-semibold" style={{ color: 'var(--error)' }}>
                      ✗ Incorrecto — La respuesta correcta es {pregunta.respuesta_correcta}
                    </p>
                  </div>

                  {/* Study recommendation card */}
                  {resumenTema && (
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                      <button
                        onClick={() => setShowResumen(!showResumen)}
                        className="w-full flex items-center justify-between p-4 text-left"
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        <span className="font-semibold text-sm">
                          📖 Estudiar: {pregunta.tema}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {showResumen ? '▲ Cerrar' : '▼ Ver resumen'}
                        </span>
                      </button>
                      {showResumen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="p-5 text-sm leading-relaxed"
                          style={{ background: 'var(--bg-card)' }}
                        >
                          <div className="font-[var(--font-body)] whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                            {resumenTema.contenido_md}
                          </div>
                          {resumenTema.tip_mir && (
                            <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--accent-light)' }}>
                              <p className="text-sm font-medium" style={{ color: 'var(--accent-dark)' }}>
                                ⚠️ Tip MIR: {resumenTema.tip_mir}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Next button */}
              <button
                onClick={onSiguiente}
                className="w-full py-3.5 text-white font-semibold rounded-xl text-base transition-all hover:shadow-lg"
                style={{ background: 'var(--accent)' }}
              >
                {progreso < total ? 'Siguiente →' : 'Ver resultados →'}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
