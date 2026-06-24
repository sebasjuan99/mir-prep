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
  const [tiempoTotalMs, setTiempoTotalMs] = useState<number | null>(null)
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
      setTiempoTotalMs(null)
      startTime.current = Date.now()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Reanuda el simulacro en curso (si existe), restaurando preguntas, respuestas
  // ya dadas y la posición donde quedó. Devuelve true si reanudó algo.
  const reanudarSimulacro = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    try {
      const res = await fetch('/api/simulacro/en-curso')
      if (!res.ok) return false
      const data = await res.json()
      if (!data.sesion || !Array.isArray(data.preguntas) || data.preguntas.length === 0) return false

      const respondidas: RespuestaUsuario[] = data.respuestas || []
      const answeredIds = new Set(respondidas.map((r) => r.pregunta_id))
      const preguntasOrden: Pregunta[] = data.preguntas
      let idx = preguntasOrden.findIndex((p) => !answeredIds.has(p.id))
      if (idx === -1) idx = preguntasOrden.length - 1 // todas respondidas → última

      setPreguntas(preguntasOrden)
      setSesionId(data.sesion.sesion_id)
      setRespuestas(respondidas)
      setCurrentIndex(idx)
      setSelectedOption(null)
      setShowResult(false)
      setCompletado(false)
      setScore(null)
      setTiempoTotalMs(null)
      startTime.current = Date.now()
      return true
    } catch (err) {
      console.error(err)
      return false
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

    // Guardado incremental: persiste la respuesta en el momento (no bloquea la UI).
    if (sesionId) {
      fetch('/api/simulacro/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion_id: sesionId, ...resp }),
      }).catch(() => {})
    }
  }, [showResult, preguntaActual, sesionId])

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
        setTiempoTotalMs(typeof data.tiempoTotalMs === 'number' ? data.tiempoTotalMs : null)
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
    tiempoTotalMs,
    respuestas,
    iniciarSimulacro,
    reanudarSimulacro,
    responder,
    siguiente,
  }
}
