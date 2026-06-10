'use client'

import { useState, useCallback, useRef } from 'react'

interface Opcion {
  letra: string
  texto: string
}

interface Pregunta {
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

interface RespuestaUsuario {
  pregunta_id: string
  respuesta: string
  correcta: boolean
  tiempo_ms: number
}

export function useSimulacro() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [respuestas, setRespuestas] = useState<RespuestaUsuario[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sesionId, setSesionId] = useState<string | null>(null)
  const [completado, setCompletado] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const startTime = useRef<number>(Date.now())

  const preguntaActual = preguntas[currentIndex] || null
  const progreso = preguntas.length > 0 ? currentIndex + 1 : 0
  const total = preguntas.length

  const iniciarSimulacro = useCallback(async (tipo: string = 'aleatorio', filtro?: string, universidad?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tipo })
      if (filtro) params.set('especialidad', filtro)
      if (universidad) params.set('universidad', universidad)
      const res = await fetch(`/api/simulacro/nuevo?${params}`)
      if (!res.ok) throw new Error('Error al crear simulacro')
      const data = await res.json()
      setPreguntas(data.preguntas)
      setSesionId(data.sesion_id)
      setCurrentIndex(0)
      setRespuestas([])
      setSelectedOption(null)
      setShowResult(false)
      setCompletado(false)
      setScore(null)
      startTime.current = Date.now()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const responder = useCallback((letra: string) => {
    if (showResult || !preguntaActual) return
    const tiempoMs = Date.now() - startTime.current
    const correcta = letra === preguntaActual.respuesta_correcta

    const resp: RespuestaUsuario = {
      pregunta_id: preguntaActual.id,
      respuesta: letra,
      correcta,
      tiempo_ms: tiempoMs,
    }

    setSelectedOption(letra)
    setShowResult(true)
    setRespuestas(prev => [...prev, resp])
  }, [showResult, preguntaActual])

  const siguiente = useCallback(async () => {
    if (currentIndex < preguntas.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setShowResult(false)
      startTime.current = Date.now()
    } else {
      // Complete the simulacro
      try {
        const res = await fetch('/api/simulacro/completar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sesion_id: sesionId,
            respuestas: [...respuestas],
          }),
        })
        const data = await res.json()
        setScore(data.score)
        setCompletado(true)
      } catch (err) {
        console.error(err)
      }
    }
  }, [currentIndex, preguntas.length, sesionId, respuestas])

  return {
    preguntas,
    preguntaActual,
    currentIndex,
    progreso,
    total,
    selectedOption,
    showResult,
    loading,
    sesionId,
    completado,
    score,
    respuestas,
    iniciarSimulacro,
    responder,
    siguiente,
  }
}
