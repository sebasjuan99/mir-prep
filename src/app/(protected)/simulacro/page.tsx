'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useSimulacro } from '@/hooks/useSimulacro'
import { useEffect, useState, Suspense } from 'react'
import FlashCard from '@/components/FlashCard'
import ResultadoSimulacro from '@/components/ResultadoSimulacro'
import { C, R, S, mono, disp, bodyFont, inkBorder, card } from '@/lib/cm'

const EXAM_ID_TO_UNIVERSIDAD: Record<string, string> = {
  unal:    'UNAL',
  ubosque: 'El Bosque',
  urosario:'Rosario',
  uces:    'CES',
  udea:    'UdeA',
  mir:     'MIR',
  enarm:   'ENARM',
}

// Franja de color por examen en la escala del manual; el fondo es blanco.
const UNIVERSIDADES = [
  { id: 'mir',      label: 'Examen MIR',     pais: 'ESPAÑA',   ac: '#9B2461' },
  { id: 'enarm',    label: 'Examen ENARM',   pais: 'MÉXICO',   ac: '#8D63A6' },
  { id: 'unal',     label: 'Univ. Nacional', pais: 'COLOMBIA', ac: '#71367F' },
  { id: 'ubosque',  label: 'Univ. Bosque',   pais: 'COLOMBIA', ac: '#C9376B' },
  { id: 'urosario', label: 'Univ. Rosario',  pais: 'COLOMBIA', ac: '#663D88' },
  { id: 'uces',     label: 'Univ. CES',      pais: 'COLOMBIA', ac: '#AF296D' },
  { id: 'udea',     label: 'Univ. Antioquia',pais: 'COLOMBIA', ac: '#442C71' },
]

interface EnCurso { sesion_id: string; tipo: string; universidad: string | null; total: number; respondidas: number }

function SimulacroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showUnivSelect, setShowUnivSelect] = useState(false)
  const [modoCompleto, setModoCompleto] = useState(false)
  const [enCurso, setEnCurso] = useState<EnCurso | null>(null)
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
    tiempoTotalMs,
    respuestas,
    iniciarSimulacro,
    reanudarSimulacro,
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
    } else {
      // Selector principal: detectar simulacro en curso para ofrecer reanudar.
      fetch('/api/simulacro/en-curso')
        .then((r) => r.json())
        .then((d) => { if (d.sesion) setEnCurso(d.sesion) })
        .catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...disp, fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: C.ink, marginBottom: 12 }}>
            Preparando...
          </div>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink2 }}>
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
        tiempoTotalMs={tiempoTotalMs}
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
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink2, marginBottom: 10 }}>
            {modoCompleto ? 'SIMULACRO COMPLETO / 100 PREGUNTAS' : 'SIMULACRO / POR UNIVERSIDAD'}
          </div>
          <h1 style={{ ...disp, fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: C.ink, margin: 0 }}>
            Elige universidad
          </h1>
        </div>

        <div style={{ ...card, overflow: 'hidden', marginBottom: 24 }}>
          {UNIVERSIDADES.map((univ, i) => (
            <button
              key={univ.id}
              onClick={() => iniciarSimulacro(modoCompleto ? 'completo' : 'universidad', undefined, EXAM_ID_TO_UNIVERSIDAD[univ.id])}
              style={{
                display: 'flex', alignItems: 'center', gap: 24,
                width: '100%', padding: '22px 28px', textAlign: 'left',
                background: C.card, cursor: 'pointer',
                border: 'none',
                borderLeft: `3px solid ${univ.ac}`,
                borderBottom: i < UNIVERSIDADES.length - 1 ? inkBorder : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', color: C.ink2, marginBottom: 4 }}>
                  {univ.pais}
                </div>
                <div style={{ ...disp, fontSize: 'clamp(1rem, 2.5vw, 1.35rem)', color: C.ink }}>
                  {univ.label}
                </div>
              </div>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', color: univ.ac }}>
                {modoCompleto ? '100 PREGUNTAS →' : 'INICIAR →'}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => { setShowUnivSelect(false); setModoCompleto(false) }}
          style={{
            ...mono, fontSize: 10, letterSpacing: '0.1em',
            background: 'transparent', border: inkBorder, borderRadius: R.sm, padding: '10px 20px',
            cursor: 'pointer', color: C.ink2,
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
      label: 'Aleatorio',
      desc: '20 preguntas de todas las especialidades al azar',
      action: () => iniciarSimulacro('aleatorio'),
    },
    {
      num: '02',
      label: 'Repasar errores',
      desc: 'Solo preguntas que has fallado anteriormente',
      action: () => iniciarSimulacro('repaso_errores'),
    },
    {
      num: '03',
      label: 'Por especialidad',
      desc: 'Elige una especialidad para practicar en profundidad',
      action: () => router.push('/especialidades'),
    },
    {
      num: '04',
      label: 'Por universidad',
      desc: 'Practica con preguntas reales de MIR, ENARM, UNAL, El Bosque o Rosario',
      action: () => { setModoCompleto(false); setShowUnivSelect(true) },
    },
    {
      num: '05',
      label: 'Simulacro completo',
      desc: '100 preguntas de una universidad. Puedes pausarlo y continuar luego.',
      action: () => { setModoCompleto(true); setShowUnivSelect(true) },
    },
  ]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink2, marginBottom: 10 }}>
          SIMULACRO
        </div>
        <h1 style={{ ...disp, fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: C.ink, margin: 0 }}>
          Nuevo simulacro
        </h1>
      </div>

      {enCurso && (
        <button
          onClick={() => { setEnCurso(null); reanudarSimulacro() }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            width: '100%', textAlign: 'left', cursor: 'pointer',
            background: C.greenSoft, color: C.ink, border: '1px solid #BFE3D1',
            borderRadius: R.lg, boxShadow: S.sm, padding: '20px 24px', marginBottom: 24,
          }}
        >
          <div>
            <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', color: C.greenDark, marginBottom: 6 }}>
              SIMULACRO EN CURSO{enCurso.universidad ? ` · ${enCurso.universidad}` : ''}
            </div>
            <div style={{ ...disp, fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)' }}>
              Continuar donde quedaste
            </div>
            <div style={{ ...mono, fontSize: 10, letterSpacing: '0.06em', color: C.ink2, marginTop: 4 }}>
              {enCurso.respondidas}/{enCurso.total} RESPONDIDAS
            </div>
          </div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', color: C.greenDark }}>CONTINUAR →</div>
        </button>
      )}

      <div style={{ ...card, overflow: 'hidden' }}>
        {opciones.map((op, i) => (
          <button
            key={op.num}
            onClick={op.action}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 24,
              width: '100%', padding: '28px 32px', textAlign: 'left',
              background: C.card, cursor: 'pointer',
              border: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottomWidth: i < opciones.length - 1 ? 1 : 0,
              borderBottomStyle: 'solid',
              borderBottomColor: C.line,
            }}
          >
            <div style={{
              ...disp, fontSize: 'clamp(2rem, 6vw, 3rem)', color: C.purple,
              opacity: 0.22, lineHeight: 1, flexShrink: 0, width: 72,
            }}>
              {op.num}
            </div>
            <div style={{ paddingTop: 6 }}>
              <div style={{ ...disp, fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: C.ink, marginBottom: 8 }}>
                {op.label}
              </div>
              <div style={{ ...bodyFont, fontSize: 14, color: C.ink2, lineHeight: 1.6 }}>
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
        <div style={{ ...disp, fontSize: '2rem', color: C.ink2 }}>
          Cargando...
        </div>
      </div>
    }>
      <SimulacroContent />
    </Suspense>
  )
}
