'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { C, G, R, S, mono, bodyFont, readFont, inkBorder, card } from '@/lib/cm'

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
    if (!showResult) return selectedOption === letra ? C.purpleSoft : C.card
    if (letra === pregunta.respuesta_correcta) return C.greenSoft
    if (letra === selectedOption && !isCorrect) return C.dangerSoft
    return C.card
  }

  const getOptionColor = () => C.ink

  /** Borde izquierdo: es lo que marca el estado sin gritar. */
  const getOptionEdge = (letra: string) => {
    if (!showResult) return selectedOption === letra ? C.purple : C.line
    if (letra === pregunta.respuesta_correcta) return C.green
    if (letra === selectedOption && !isCorrect) return C.danger
    return C.line
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
            <span style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: C.ink2 }}>
              PREGUNTA {progreso} / {total}
            </span>
            <span style={{ ...mono, fontSize: 10, letterSpacing: '0.08em', color: C.ink2 }}>
              {pregunta.numero_mir != null
                ? `MIR #${pregunta.numero_mir}`
                : (pregunta.universidad || 'PREGUNTA')}
            </span>
          </div>
          <div style={{ height: 6, background: C.cream2, borderRadius: R.pill, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, borderRadius: R.pill, background: G.brand, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ ...card, padding: '28px 32px' }}>
          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            <span style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', borderRadius: R.pill, padding: '5px 12px', background: C.purpleSoft, color: C.purple }}>
              {pregunta.especialidad.toUpperCase()}
            </span>
            <span style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', border: inkBorder, borderRadius: R.pill, padding: '5px 12px', color: C.ink2 }}>
              {pregunta.tema.toUpperCase()}
            </span>
            {pregunta.subtema && (
              <span style={{ ...mono, fontSize: 9, letterSpacing: '0.08em', border: inkBorder, borderRadius: R.pill, padding: '5px 12px', color: C.ink2 }}>
                {pregunta.subtema.toUpperCase()}
              </span>
            )}
          </div>

          {/* Question */}
          <p style={{ ...readFont, fontSize: 17, color: C.ink, marginBottom: 24 }}>
            {pregunta.enunciado}
          </p>

          {/* Image */}
          {pregunta.imagen_url && (
            <div style={{ marginBottom: 20, border: inkBorder, borderRadius: R.md, overflow: 'hidden' }}>
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
              const col = getOptionColor()
              const edge = getOptionEdge(opcion.letra)
              const dimmed = showResult && opcion.letra !== pregunta.respuesta_correcta && opcion.letra !== selectedOption
              return (
                <button
                  key={opcion.letra}
                  onClick={() => !showResult && onResponder(opcion.letra)}
                  disabled={showResult}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px',
                    border: inkBorder,
                    borderLeft: `3px solid ${edge}`,
                    borderRadius: R.md,
                    background: bg, color: col,
                    cursor: showResult ? 'default' : 'pointer',
                    textAlign: 'left', width: '100%',
                    opacity: dimmed ? 0.55 : 1,
                    boxShadow: S.xs,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <span style={{
                    ...mono, fontSize: 11, letterSpacing: '0.06em', flexShrink: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: edge === C.line ? C.cream2 : edge,
                    color: edge === C.line ? C.ink2 : '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                <div style={{ border: '1px solid #BFE3D1', borderRadius: R.md, background: C.greenSoft, padding: '12px 16px' }}>
                  <span style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.greenDark }}>CORRECTO — BIEN HECHO</span>
                </div>
              ) : (
                <>
                  <div style={{ border: '1px solid #F2C4CA', borderRadius: R.md, background: C.dangerSoft, padding: '12px 16px' }}>
                    <span style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.danger }}>
                      INCORRECTO — CORRECTA: {pregunta.respuesta_correcta}
                    </span>
                  </div>
                  {resumenTema && (
                    <div style={{ border: inkBorder, borderRadius: R.md, overflow: 'hidden' }}>
                      <button
                        onClick={() => setShowResumen(!showResumen)}
                        style={{
                          ...mono, fontSize: 9, letterSpacing: '0.1em', width: '100%',
                          padding: '11px 16px', display: 'flex', justifyContent: 'space-between',
                          background: C.cream2, border: 'none',
                          borderBottom: showResumen ? inkBorder : 'none',
                          cursor: 'pointer', color: C.ink,
                        }}
                      >
                        <span>ESTUDIAR: {pregunta.tema.toUpperCase()}</span>
                        <span style={{ opacity: 0.5 }}>{showResumen ? '▲ CERRAR' : '▼ VER RESUMEN'}</span>
                      </button>
                      {showResumen && (
                        <div style={{ padding: '16px 18px', background: C.card }}>
                          <div style={{ ...readFont, fontSize: 14, color: C.ink, whiteSpace: 'pre-wrap' }}>
                            {resumenTema.contenido_md}
                          </div>
                          {resumenTema.tip_mir && (
                            <div style={{ marginTop: 12, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.purple}`, borderRadius: R.sm, background: C.purpleSoft, padding: '10px 14px' }}>
                              <span style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', color: C.purple }}>TIP MIR — </span>
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
                  ...bodyFont, fontSize: 15, fontWeight: 600,
                  width: '100%', padding: '15px',
                  background: G.brandVivid, color: '#FFFFFF',
                  border: '1px solid transparent', borderRadius: R.sm,
                  boxShadow: S.brand, cursor: 'pointer',
                }}
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
