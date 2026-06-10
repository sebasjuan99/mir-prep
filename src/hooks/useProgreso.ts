'use client'

import { useState, useCallback, useEffect } from 'react'

interface ProgresoEspecialidad {
  especialidad: string
  total: number
  correctas: number
  porcentaje: number
}

interface Debilidad {
  especialidad: string
  tema: string
  total: number
  correctas: number
  porcentaje: number
}

interface HistorialItem {
  id: string
  tipo: string
  filtro: string | null
  universidad: string | null
  score: number
  total: number
  createdAt: string
}

interface UniversidadStat {
  universidad: string
  total: number
  correctas: number
  porcentaje: number
}

export function useProgreso() {
  const [progresoGlobal, setProgresoGlobal] = useState<{
    total: number
    correctas: number
    porcentaje: number
    porEspecialidad: ProgresoEspecialidad[]
  } | null>(null)
  const [debilidades, setDebilidades] = useState<Debilidad[]>([])
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [universidades, setUniversidades] = useState<UniversidadStat[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProgreso = useCallback(async () => {
    try {
      const [progRes, debRes, histRes, univRes] = await Promise.all([
        fetch('/api/progreso'),
        fetch('/api/progreso/debilidades'),
        fetch('/api/simulacro/historial'),
        fetch('/api/progreso/universidades'),
      ])

      if (progRes.ok) setProgresoGlobal(await progRes.json())
      if (debRes.ok) setDebilidades(await debRes.json())
      if (histRes.ok) {
        const data = await histRes.json()
        setHistorial(data.historial || [])
      }
      if (univRes.ok) setUniversidades(await univRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgreso()
  }, [fetchProgreso])

  return { progresoGlobal, debilidades, historial, universidades, loading, refresh: fetchProgreso }
}
