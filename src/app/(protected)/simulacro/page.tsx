'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useSimulacro } from '@/hooks/useSimulacro'
import { useEffect, useState, Suspense } from 'react'
import FlashCard from '@/components/FlashCard'
import ResultadoSimulacro from '@/components/ResultadoSimulacro'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'

const EXAM_ID_TO_UNIVERSIDAD: Record<string, string> = {
  unal:    'UNAL',
  ubosque: 'El Bosque',
  urosario:'Rosario',
  uces:    'CES',
  mir:     'MIR',
  enarm:   'ENARM',
}

const UNIVERSIDADES = [
  { id: 'mir',      label: 'EXAMEN MIR',     pais: 'ESPAÑA',   bg: C.ink,      color: C.cream },
  { id: 'enarm',    label: 'EXAMEN ENARM',   pais: 'MÉXICO',   bg: C.pink,     color: C.ink   },
  { id: 'unal',     label: 'UNIV. NACIONAL', pais: 'COLOMBIA', bg: C.green,    color: C.cream },
  { id: 'ubosque',  label: 'UNIV. BOSQUE',   pais: 'COLOMBIA', bg: C.cream2,   color: C.ink   },
  { id: 'urosario', label: 'UNIV. ROSARIO',  pais: 'COLOMBIA', bg: C.orange,   color: C.cream },
  { id: 'uces',     label: 'UNIV. CES',      pais: 'COLOMBIA', bg: '#2E4057', color: C.cream },
]

function SimulacroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showUnivSelect, setShowUnivSelect] = useState(false)
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
  const examen = searchParams.get('examen')
  const universidad = examen ? EXAM_ID_TO_UNIVERSIDAD[examen] : null

  useEffect(() => {
    if (universidad) {
      iniciarSimulacro('universidad', undefined, universidad)
    } else if (especialidad || tipo === 'repaso_errores') {
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

  // University sub-selector
  if (showUnivSelect) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink, opacity: 0.45, marginBottom: 10 }}>
            SIMULACRO / POR UNIVERSIDAD
          </div>
          <h1 style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 5rem)', color: C.ink, margin: 0 }}>
            ELIGE UNIVERSIDAD
          </h1>
        </div>

        <div style={{ border: inkBorder, marginBottom: 24 }}>
          {UNIVERSIDADES.map((univ, i) => (
            <button
              key={univ.id}
              onClick={() => iniciarSimulacro('universidad', undefined, EXAM_ID_TO_UNIVERSIDAD[univ.id])}
              style={{
                display: 'flex', alignItems: 'center', gap: 24,
                width: '100%', padding: '22px 28px', textAlign: 'left',
                background: univ.bg, cursor: 'pointer',
                border: 'none',
                borderBottom: i < UNIVERSIDADES.length - 1 ? `3px solid ${C.ink}` : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', color: univ.color, opacity: 0.65, marginBottom: 4 }}>
                  {univ.pais}
                </div>
                <div style={{ ...disp, fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', color: univ.color }}>
                  {univ.label}
                </div>
              </div>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', color: univ.color, opacity: 0.55 }}>
                INICIAR →
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowUnivSelect(false)}
          style={{
            ...mono, fontSize: 10, letterSpacing: '0.1em',
            background: 'transparent', border: inkBorder, padding: '10px 20px',
            cursor: 'pointer', color: C.ink,
          }}
        >
          ← VOLVER
        </button>
      </div>
    )
  }

  // Main selector
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
    {
      num: '04',
      label: 'POR UNIVERSIDAD',
      desc: 'Practica con preguntas reales de MIR, ENARM, UNAL, El Bosque o Rosario',
      action: () => setShowUnivSelect(true),
    },
  ]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink, opacity: 0.45, marginBottom: 10 }}>
          SIMULACRO
        </div>
        <h1 style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 5rem)', color: C.ink, margin: 0 }}>
          NUEVO SIMULACRO
        </h1>
      </div>

      <div style={{ border: inkBorder }}>
        {opciones.map((op, i) => (
          <button
            key={op.num}
            onClick={op.action}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 24,
              width: '100%', padding: '28px 32px', textAlign: 'left',
              background: C.cream, cursor: 'pointer',
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
