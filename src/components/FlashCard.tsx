'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'

interface Opcion {
  letra: string
  texto: string
}

interface PreguntaData {
  id: string
  numero_mir: number | null
  enunciado: string
  opciones: Opcion[]
  respuesta_correcta: string
  imagen_url: string | null
  especialidad: string
  tema: string
  subtema: string | null
  universidad: string | null
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

  useEffect(() => { setShowResumen(false) }, [pregunta.id])

  const getOptionBg = (letra: string) => {
    if (!showResult) return selectedOption === letra ? C.ink : C.cream
    if (letra === pregunta.respuesta_correcta) return C.green
    if (letra === selectedOption && !isCorrect) return C.orange
    return C.cream
  }

  const getOptionColor = (letra: string) => {
    if (!showResult) return selectedOption === letra ? C.cream : C.ink
    if (letra === pregunta.respuesta_correcta) return C.cream
    if (letra === selectedOption && !isCorrect) return C.cream
    return C.ink
  }

  const progressPct = Math.round((progreso / total) * 100)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pregunta.id}
        initial={{ x: 48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -48, opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}
      >
        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: C.ink, opacity: 0.5 }}>
              PREGUNTA {progreso} / {total}
            </span>
            <span style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', color: C.ink, opacity: 0.5 }}>
              {pregunta.numero_mir != null
                ? `MIR #${pregunta.numero_mir}`
                : (pregunta.universidad || 'PREGUNTA')}
            </span>
          </div>
          <div style={{ height: 6, background: C.cream2, border: `2px solid ${C.ink}` }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: C.ink, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ border: inkBorder, background: C.cream, padding: '28px 32px' }}>
          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            <span style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', border: inkBorder, padding: '4px 10px', background: C.ink, color: C.cream }}>
              {pregunta.especialidad.toUpperCase()}
            </span>
            <span style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', border: `2px solid ${C.ink}`, padding: '4px 10px', color: C.ink }}>
              {pregunta.tema.toUpperCase()}
            </span>
            {pregunta.subtema && (
              <span style={{ ...mono, fontSize: 9, letterSpacing: '0.08em', border: `2px solid ${C.ink}`, padding: '4px 10px', color: C.ink, opacity: 0.6 }}>
                {pregunta.subtema.toUpperCase()}
              </span>
            )}
          </div>

          {/* Question */}
          <p style={{ ...bodyFont, fontSize: 17, lineHeight: 1.65, color: C.ink, marginBottom: 24 }}>
            {pregunta.enunciado}
          </p>

          {/* Image */}
          {pregunta.imagen_url && (
            <div style={{ marginBottom: 20, border: inkBorder, overflow: 'hidden' }}>
              <img
                src={pregunta.imagen_url}
                alt={pregunta.numero_mir != null ? `MIR ${pregunta.numero_mir}` : pregunta.especialidad}
                style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: '#fff' }}
                loading="lazy"
              />
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {pregunta.opciones.map(opcion => {
              const bg = getOptionBg(opcion.letra)
              const col = getOptionColor(opcion.letra)
              const dimmed = showResult && opcion.letra !== pregunta.respuesta_correcta && opcion.letra !== selectedOption
              return (
                <button
                  key={opcion.letra}
                  onClick={() => !showResult && onResponder(opcion.letra)}
                  disabled={showResult}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '13px 16px',
                    border: `3px solid ${C.ink}`,
                    background: bg, color: col,
                    cursor: showResult ? 'default' : 'pointer',
                    textAlign: 'left', width: '100%',
                    opacity: dimmed ? 0.4 : 1,
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{
                    ...mono, fontSize: 11, letterSpacing: '0.06em', flexShrink: 0,
                    width: 26, height: 26, border: `2px solid ${col}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: col,
                  }}>
                    {showResult && opcion.letra === pregunta.respuesta_correcta ? '✓'
                      : showResult && opcion.letra === selectedOption && !isCorrect ? '✗'
                      : opcion.letra}
                  </span>
                  <span style={{ ...bodyFont, fontSize: 15, lineHeight: 1.5, color: col, paddingTop: 3 }}>
                    {opcion.texto}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Result */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {isCorrect ? (
                <div style={{ border: `3px solid ${C.green}`, background: C.green, padding: '11px 16px' }}>
                  <span style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.cream }}>CORRECTO — BIEN HECHO</span>
                </div>
              ) : (
                <>
                  <div style={{ border: `3px solid ${C.orange}`, background: C.orange, padding: '11px 16px' }}>
                    <span style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.cream }}>
                      INCORRECTO — CORRECTA: {pregunta.respuesta_correcta}
                    </span>
                  </div>
                  {resumenTema && (
                    <div style={{ border: inkBorder }}>
                      <button
                        onClick={() => setShowResumen(!showResumen)}
                        style={{
                          ...mono, fontSize: 9, letterSpacing: '0.1em', width: '100%',
                          padding: '11px 16px', display: 'flex', justifyContent: 'space-between',
                          background: C.cream2, border: 'none',
                          borderBottom: showResumen ? `3px solid ${C.ink}` : 'none',
                          cursor: 'pointer', color: C.ink,
                        }}
                      >
                        <span>ESTUDIAR: {pregunta.tema.toUpperCase()}</span>
                        <span style={{ opacity: 0.5 }}>{showResumen ? '▲ CERRAR' : '▼ VER RESUMEN'}</span>
                      </button>
                      {showResumen && (
                        <div style={{ padding: '16px 18px', background: C.cream }}>
                          <div style={{ ...bodyFont, fontSize: 14, lineHeight: 1.65, color: C.ink, whiteSpace: 'pre-wrap' }}>
                            {resumenTema.contenido_md}
                          </div>
                          {resumenTema.tip_mir && (
                            <div style={{ marginTop: 12, border: `2px solid ${C.orange}`, padding: '10px 14px' }}>
                              <span style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', color: C.orange }}>TIP MIR — </span>
                              <span style={{ ...bodyFont, fontSize: 13, color: C.ink }}>{resumenTema.tip_mir}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <button
                onClick={onSiguiente}
                style={{
                  ...mono, fontSize: 11, letterSpacing: '0.1em',
                  width: '100%', padding: '15px',
                  background: C.ink, color: C.cream,
                  border: inkBorder, cursor: 'pointer',
                }}
              >
                {progreso < total ? 'SIGUIENTE →' : 'VER RESULTADOS →'}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
