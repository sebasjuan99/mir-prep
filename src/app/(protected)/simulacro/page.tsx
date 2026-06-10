'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useSimulacro } from '@/hooks/useSimulacro'
import { useEffect, Suspense } from 'react'
import FlashCard from '@/components/FlashCard'
import ResultadoSimulacro from '@/components/ResultadoSimulacro'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'

function SimulacroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    preguntas,
    preguntaActual,
    progreso,
    total,
    selectedOption,
    showResult,
    loading,
    completado,
    score,
    respuestas,
    iniciarSimulacro,
    responder,
    siguiente,
  } = useSimulacro()

  const especialidad = searchParams.get('especialidad')
  const tipo = searchParams.get('tipo') || 'aleatorio'

  useEffect(() => {
    if (especialidad || tipo === 'repaso_errores') {
      iniciarSimulacro(tipo, especialidad || undefined)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...disp, fontSize: 'clamp(2rem, 5vw, 4rem)', color: C.ink, marginBottom: 12 }}>
            PREPARANDO...
          </div>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink, opacity: 0.45 }}>
            SELECCIONANDO 20 PREGUNTAS
          </div>
        </div>
      </div>
    )
  }

  if (completado && score !== null) {
    return (
      <ResultadoSimulacro
        score={score}
        total={total}
        respuestas={respuestas}
        preguntas={preguntas}
        onNuevoSimulacro={() => iniciarSimulacro('aleatorio')}
        onRepasarErrores={() => iniciarSimulacro('repaso_errores')}
      />
    )
  }

  if (preguntaActual) {
    return (
      <div style={{ paddingTop: 8, paddingBottom: 40 }}>
        <FlashCard
          pregunta={preguntaActual}
          progreso={progreso}
          total={total}
          onResponder={responder}
          onSiguiente={siguiente}
          selectedOption={selectedOption}
          showResult={showResult}
        />
      </div>
    )
  }

  // Selector
  const opciones = [
    {
      num: '01',
      label: 'ALEATORIO',
      desc: '20 preguntas de todas las especialidades al azar',
      action: () => iniciarSimulacro('aleatorio'),
    },
    {
      num: '02',
      label: 'REPASAR ERRORES',
      desc: 'Solo preguntas que has fallado anteriormente',
      action: () => iniciarSimulacro('repaso_errores'),
    },
    {
      num: '03',
      label: 'POR ESPECIALIDAD',
      desc: 'Elige una especialidad para practicar en profundidad',
      action: () => router.push('/especialidades'),
    },
  ]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink, opacity: 0.45, marginBottom: 10 }}>
          SIMULACRO
        </div>
        <h1 style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 5rem)', color: C.ink, margin: 0 }}>
          NUEVO SIMULACRO
        </h1>
      </div>

      {/* Option cards */}
      <div style={{ border: inkBorder }}>
        {opciones.map((op, i) => (
          <button
            key={op.num}
            onClick={op.action}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 24,
              width: '100%', padding: '28px 32px', textAlign: 'left',
              background: C.cream, cursor: 'pointer',
              borderBottom: i < opciones.length - 1 ? `3px solid ${C.ink}` : 'none',
              border: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottomWidth: i < opciones.length - 1 ? 3 : 0,
              borderBottomStyle: 'solid',
              borderBottomColor: C.ink,
            }}
          >
            <div style={{
              ...disp, fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: C.ink,
              opacity: 0.12, lineHeight: 1, flexShrink: 0, width: 72,
            }}>
              {op.num}
            </div>
            <div style={{ paddingTop: 6 }}>
              <div style={{ ...disp, fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: C.ink, marginBottom: 8 }}>
                {op.label}
              </div>
              <div style={{ ...bodyFont, fontSize: 14, color: C.ink, opacity: 0.55, lineHeight: 1.5 }}>
                {op.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SimulacroPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '2rem', textTransform: 'uppercase', color: C.ink, opacity: 0.3 }}>
          CARGANDO...
        </div>
      </div>
    }>
      <SimulacroContent />
    </Suspense>
  )
}
