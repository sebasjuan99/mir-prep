'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ESPECIALIDAD_ICONS } from '@/lib/constants'

interface Especialidad {
  nombre: string
  totalPreguntas: number
  respondidas: number
  correctas: number
  porcentaje: number | null
}

export default function EspecialidadesPage() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/especialidades')
      .then(r => r.json())
      .then(data => {
        setEspecialidades(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-lg skeleton" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[var(--font-display)] text-3xl font-bold mb-2">
          Especialidades
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Elige una especialidad para hacer un simulacro filtrado
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {especialidades.map(esp => {
          const icon = ESPECIALIDAD_ICONS[esp.nombre] || '🏥'
          const hasProgress = esp.porcentaje !== null
          let bgColor = 'var(--bg-card)'
          let borderColor = 'var(--border)'

          if (hasProgress) {
            if (esp.porcentaje! >= 80) {
              bgColor = 'var(--success-light)'
              borderColor = 'var(--success)'
            } else if (esp.porcentaje! < 50) {
              bgColor = 'var(--error-light)'
              borderColor = 'var(--error)'
            }
          }

          return (
            <Link
              key={esp.nombre}
              href={`/simulacro?especialidad=${encodeURIComponent(esp.nombre)}&tipo=especialidad`}
              className="p-5 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5 block"
              style={{ background: bgColor, border: `1px solid ${borderColor}`, boxShadow: 'var(--shadow)' }}
            >
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-[var(--font-display)] text-sm font-bold mb-1 leading-tight">
                {esp.nombre}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {esp.totalPreguntas} preguntas
              </p>
              {hasProgress && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${esp.porcentaje}%`,
                        background: esp.porcentaje! >= 60 ? 'var(--success)' : 'var(--error)',
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1 font-medium" style={{ color: esp.porcentaje! >= 60 ? 'var(--success)' : 'var(--error)' }}>
                    {esp.porcentaje}% aciertos
                  </p>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
