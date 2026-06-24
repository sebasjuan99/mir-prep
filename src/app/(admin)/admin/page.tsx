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
  universidad: string | null
  score: number | null
  total: number
  completada: boolean
  createdAt: string
  usuario: { nombre: string | null; email: string } | null
}

// Etiqueta legible de qué está practicando la persona en esa sesión.
function examenLabel(s: RecentSession): string {
  if (s.universidad) return s.universidad
  if (s.tipo === 'especialidad') return s.filtro ? `Especialidad: ${s.filtro}` : 'Por especialidad'
  if (s.tipo === 'repaso_errores') return 'Repaso de errores'
  if (s.tipo === 'aleatorio') return 'Aleatorio'
  return s.tipo
}

interface StatsData {
  totalPreguntas: number
  totalUsuarios: number
  sesionesCompletadas: number
  sesionesIniciadas: number
  totalRespuestas: number
  respuestasCompletadas: number
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
      <div className="space-y-10">
        <header>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Panel de administración</p>
          <h1 className="text-3xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
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
    { label: 'Total preguntas', value: stats.totalPreguntas, color: 'var(--accent)', sub: undefined as string | undefined, tip: 'Número total de preguntas en el banco.' },
    { label: 'Total usuarios', value: stats.totalUsuarios, color: '#5B8DEF', sub: undefined, tip: 'Número total de usuarios registrados.' },
    { label: 'Sesiones completadas', value: stats.sesionesCompletadas, color: 'var(--success)', sub: `${stats.sesionesIniciadas ?? stats.sesionesCompletadas} iniciadas`, tip: 'Simulacros que el usuario terminó (llegó a la última pregunta). El subtítulo muestra cuántos se iniciaron en total, incluidos los abandonados a mitad.' },
    { label: 'Respuestas totales', value: stats.totalRespuestas, color: '#9B6DD7', sub: 'incluye simulacros en curso', tip: 'Todas las respuestas registradas. Como ahora cada respuesta se guarda al instante, incluye también las de simulacros aún en curso o abandonados.' },
    { label: 'Respuestas (completados)', value: stats.respuestasCompletadas ?? 0, color: '#C17E4A', sub: 'solo simulacros terminados', tip: 'Respuestas que pertenecen a simulacros que el usuario terminó. Es la cifra comparable con el histórico previo.' },
  ]

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Panel de administración</p>
        <h1 className="text-3xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px rounded-xl overflow-hidden" style={{ background: 'var(--border)', border: '1px solid var(--border)' }}>
        {statCards.map((card) => (
          <div key={card.label} title={card.tip} className="p-5 cursor-help" style={{ background: 'var(--bg-card)' }}>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase mb-3 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              {card.label}
              <span aria-hidden className="inline-flex items-center justify-center text-[9px] rounded-full w-3.5 h-3.5" style={{ border: '1px solid var(--text-muted)', opacity: 0.5 }}>i</span>
            </p>
            <p className="text-4xl font-bold font-[var(--font-display)] leading-none" style={{ color: card.color }}>{card.value.toLocaleString()}</p>
            {card.sub && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {stats.especialidades.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-xs font-semibold tracking-[0.12em] uppercase mb-5" style={{ color: 'var(--text-muted)' }}>
            Especialidades \u2014 % de aciertos
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
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase mb-4" style={{ color: 'var(--error)' }}>Peores especialidades</h3>
            <div className="space-y-2">
              {worst.map((e) => (
                <div key={e.especialidad} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'var(--error-light)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{e.especialidad}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--error)' }}>{e.porcentaje}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase mb-4" style={{ color: 'var(--success)' }}>Mejores especialidades</h3>
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
      <div className="rounded-xl p-6 overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>Sesiones recientes</h2>
        <p className="text-xs mb-5 mt-1" style={{ color: 'var(--text-muted)' }}>\u00daltimos 10 simulacros. <strong>Examen</strong>: qu\u00e9 est\u00e1 practicando. <strong>Score</strong>: aciertos / total. <strong>Estado</strong>: si termin\u00f3 el simulacro o sigue en curso.</p>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {[
                { h: 'Usuario', t: 'Nombre o correo de quien hizo el simulacro' },
                { h: 'Examen / pr\u00e1ctica', t: 'Tipo de examen o modo que est\u00e1 preparando' },
                { h: 'Score', t: 'Respuestas correctas sobre el total del simulacro' },
                { h: 'Estado', t: 'Completada = termin\u00f3; En curso = a\u00fan sin terminar' },
                { h: 'Fecha', t: 'Fecha en que inici\u00f3 el simulacro' },
              ].map((c) => (
                <th key={c.h} title={c.t} className="text-left py-2 px-3 font-semibold cursor-help" style={{ color: 'var(--text-muted)' }}>{c.h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.recentSessions.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2.5 px-3">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.usuario?.nombre || s.usuario?.email || 'Usuario desconocido'}</span>
                  {s.usuario?.nombre && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{s.usuario.email}</span>}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>{examenLabel(s)}</span>
                </td>
                <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>{s.score !== null ? `${s.score}/${s.total}` : '\u2014'}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.completada ? 'var(--success-light)' : 'var(--bg-secondary)', color: s.completada ? 'var(--success)' : 'var(--text-muted)' }}>
                    {s.completada ? 'Completada' : 'En curso'}
                  </span>
                </td>
                <td className="py-2.5 px-3" style={{ color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString('es-ES')}</td>
              </tr>
            ))}
            {stats.recentSessions.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>No hay sesiones recientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
