'use client'

import { useState, useEffect } from 'react'

interface EspecialidadStat {
  especialidad: string
  total: number
  correctas: number
  porcentaje: number
}

interface RecentSession {
  id: string
  user_id: string
  tipo: string
  filtro: string | null
  score: number | null
  total: number
  completada: boolean
  createdAt: string
}

interface StatsData {
  totalPreguntas: number
  totalUsuarios: number
  sesionesCompletadas: number
  totalRespuestas: number
  especialidades: EspecialidadStat[]
  recentSessions: RecentSession[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="skeleton h-80 rounded-xl" />
      </div>
    )
  }

  if (!stats) return <p style={{ color: 'var(--error)' }}>Error cargando datos</p>

  const sorted = [...stats.especialidades].sort((a, b) => a.porcentaje - b.porcentaje)
  const worst = sorted.slice(0, 5)
  const best = [...sorted].reverse().slice(0, 5)

  const statCards = [
    { label: 'Total preguntas', value: stats.totalPreguntas, color: 'var(--accent)' },
    { label: 'Total usuarios', value: stats.totalUsuarios, color: '#5B8DEF' },
    { label: 'Sesiones completadas', value: stats.sesionesCompletadas, color: 'var(--success)' },
    { label: 'Respuestas totales', value: stats.totalRespuestas, color: '#9B6DD7' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
            <p className="text-3xl font-bold font-[var(--font-display)]" style={{ color: card.color }}>{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {stats.especialidades.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <h2 className="text-lg font-bold mb-5 font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>
            Especialidades \u2014 Porcentaje de aciertos
          </h2>
          <div className="space-y-3">
            {sorted.map((esp) => (
              <div key={esp.especialidad} className="flex items-center gap-3">
                <span className="text-xs font-medium w-36 truncate text-right" style={{ color: 'var(--text-muted)' }} title={esp.especialidad}>{esp.especialidad}</span>
                <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(esp.porcentaje, 2)}%`, background: esp.porcentaje >= 70 ? 'var(--success)' : esp.porcentaje >= 50 ? 'var(--accent)' : 'var(--error)' }} />
                </div>
                <span className="text-sm font-bold w-12 text-right" style={{ color: 'var(--text-primary)' }}>{esp.porcentaje}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best / Worst */}
      {stats.especialidades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--error)' }}>Peores especialidades</h3>
            <div className="space-y-2">
              {worst.map((e) => (
                <div key={e.especialidad} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'var(--error-light)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{e.especialidad}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--error)' }}>{e.porcentaje}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--success)' }}>Mejores especialidades</h3>
            <div className="space-y-2">
              {best.map((e) => (
                <div key={e.especialidad} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'var(--success-light)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{e.especialidad}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>{e.porcentaje}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div className="rounded-xl p-6 overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <h2 className="text-lg font-bold mb-5 font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Sesiones recientes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['ID', 'Tipo', 'Filtro', 'Score', 'Estado', 'Fecha'].map((h) => (
                <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.recentSessions.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2.5 px-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{s.id.slice(0, 8)}...</td>
                <td className="py-2.5 px-3">{s.tipo}</td>
                <td className="py-2.5 px-3" style={{ color: 'var(--text-muted)' }}>{s.filtro || '\u2014'}</td>
                <td className="py-2.5 px-3 font-bold">{s.score !== null ? `${s.score}/${s.total}` : '\u2014'}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.completada ? 'var(--success-light)' : 'var(--bg-secondary)', color: s.completada ? 'var(--success)' : 'var(--text-muted)' }}>
                    {s.completada ? 'Completada' : 'En curso'}
                  </span>
                </td>
                <td className="py-2.5 px-3" style={{ color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString('es-ES')}</td>
              </tr>
            ))}
            {stats.recentSessions.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>No hay sesiones recientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
