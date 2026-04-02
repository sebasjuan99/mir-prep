'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useProgreso } from '@/hooks/useProgreso'
import { ESPECIALIDAD_ICONS } from '@/lib/constants'

export default function DashboardPage() {
  const { user } = useAuth()
  const { progresoGlobal, debilidades, historial, loading } = useProgreso()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 rounded-lg skeleton" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl skeleton" />
          <div className="h-64 rounded-2xl skeleton" />
        </div>
      </div>
    )
  }

  const porcentajeGlobal = progresoGlobal?.porcentaje ?? 0

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-[var(--font-display)] text-3xl font-bold mb-1">
          Bienvenido de vuelta 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {user?.email} — Sigue preparando el MIR
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN - Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Simulacro CTA */}
          <Link
            href="/simulacro"
            className="block p-8 rounded-2xl text-center text-white transition-all hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}
          >
            <div className="text-4xl mb-3">📝</div>
            <h2 className="font-[var(--font-display)] text-2xl font-bold mb-2">
              Nuevo Simulacro
            </h2>
            <p className="text-sm opacity-90">20 preguntas aleatorias del MIR 2025</p>
          </Link>

          {/* Quick specialty links */}
          <div
            className="p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          >
            <h3 className="font-[var(--font-display)] text-lg font-bold mb-4">
              Por especialidad
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(progresoGlobal?.porEspecialidad?.slice(0, 8) || []).map(esp => (
                <Link
                  key={esp.especialidad}
                  href={`/simulacro?especialidad=${encodeURIComponent(esp.especialidad)}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors hover:opacity-80"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <span>{ESPECIALIDAD_ICONS[esp.especialidad] || '🏥'}</span>
                  <span className="truncate">{esp.especialidad}</span>
                </Link>
              ))}
            </div>
            <Link
              href="/especialidades"
              className="block mt-3 text-center text-sm font-medium py-2"
              style={{ color: 'var(--accent)' }}
            >
              Ver todas →
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN - Progress */}
        <div className="lg:col-span-3 space-y-6">
          {/* Global score */}
          <div
            className="p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          >
            <h3 className="font-[var(--font-display)] text-lg font-bold mb-4">Tu progreso global</h3>
            <div className="flex items-center gap-6 mb-6">
              <div
                className="relative w-24 h-24 flex items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--accent) ${porcentajeGlobal * 3.6}deg, var(--bg-secondary) 0deg)`,
                }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <span className="text-2xl font-bold">{porcentajeGlobal}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {progresoGlobal?.correctas ?? 0} correctas de {progresoGlobal?.total ?? 0} respondidas
                </p>
              </div>
            </div>

            {/* Per-specialty bars */}
            <div className="space-y-3">
              {(progresoGlobal?.porEspecialidad?.slice(0, 6) || []).map(esp => (
                <div key={esp.especialidad}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{esp.especialidad}</span>
                    <span style={{ color: esp.porcentaje >= 60 ? 'var(--success)' : 'var(--error)' }}>
                      {esp.porcentaje}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${esp.porcentaje}%`,
                        background: esp.porcentaje >= 60 ? 'var(--success)' : 'var(--error)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          {debilidades.length > 0 && (
            <div
              className="p-6 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
            >
              <h3 className="font-[var(--font-display)] text-lg font-bold mb-4">
                ⚠️ Tus puntos débiles
              </h3>
              <div className="space-y-2">
                {debilidades.slice(0, 5).map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 rounded-lg"
                    style={{ background: 'var(--error-light)' }}
                  >
                    <div>
                      <span className="text-sm font-medium">{d.tema}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                        {d.especialidad}
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--error)' }}>
                      {d.porcentaje}%
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/simulacro?tipo=repaso_errores"
                className="block mt-4 text-center py-2.5 rounded-lg text-sm font-semibold border"
                style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
              >
                Repasar mis errores
              </Link>
            </div>
          )}

          {/* Recent history */}
          {historial.length > 0 && (
            <div
              className="p-6 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
            >
              <h3 className="font-[var(--font-display)] text-lg font-bold mb-4">
                Últimos simulacros
              </h3>
              <div className="space-y-2">
                {historial.slice(0, 5).map(h => {
                  const pct = h.total > 0 ? Math.round(((h.score ?? 0) / h.total) * 100) : 0
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between px-4 py-3 rounded-lg"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <div>
                        <span className="text-sm font-medium">
                          {h.filtro || 'Aleatorio'}
                        </span>
                        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                          {new Date(h.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ color: pct >= 60 ? 'var(--success)' : 'var(--error)' }}
                      >
                        {h.score}/{h.total}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
