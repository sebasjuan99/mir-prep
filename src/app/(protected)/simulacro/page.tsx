'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useSimulacro } from '@/hooks/useSimulacro'
import { useEffect, Suspense } from 'react'
import FlashCard from '@/components/FlashCard'
import ResultadoSimulacro from '@/components/ResultadoSimulacro'

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

  // Auto-start if coming with params
  useEffect(() => {
    if (especialidad || tipo === 'repaso_errores') {
      iniciarSimulacro(tipo, especialidad || undefined)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📝</div>
          <p className="font-[var(--font-display)] text-xl font-bold mb-2">
            Preparando tu simulacro...
          </p>
          <p style={{ color: 'var(--text-muted)' }}>Seleccionando 20 preguntas</p>
        </div>
      </div>
    )
  }

  // Completed - show results
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

  // In progress - show flash card
  if (preguntaActual) {
    return (
      <div className="py-4">
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

  // Selector - choose type of simulacro
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-[var(--font-display)] text-3xl font-bold mb-2">
          Nuevo Simulacro
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Elige el tipo de simulacro que quieres hacer
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => iniciarSimulacro('aleatorio')}
          className="w-full p-6 rounded-2xl text-left transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">🎲</span>
            <div>
              <h3 className="font-[var(--font-display)] text-lg font-bold mb-1">
                Simulacro aleatorio
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                20 preguntas de todas las especialidades al azar
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => iniciarSimulacro('repaso_errores')}
          className="w-full p-6 rounded-2xl text-left transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">🔄</span>
            <div>
              <h3 className="font-[var(--font-display)] text-lg font-bold mb-1">
                Repasar mis errores
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Solo preguntas que has fallado anteriormente
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/especialidades')}
          className="w-full p-6 rounded-2xl text-left transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">🏥</span>
            <div>
              <h3 className="font-[var(--font-display)] text-lg font-bold mb-1">
                Por especialidad
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Elige una especialidad para practicar
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default function SimulacroPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="text-5xl animate-bounce">📝</div></div>}>
      <SimulacroContent />
    </Suspense>
  )
}
