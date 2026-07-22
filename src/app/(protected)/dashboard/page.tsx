'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useProgreso } from '@/hooks/useProgreso'
import DashboardCharts from '@/components/DashboardCharts'
import { C, G, R, S, disp, mono, bodyFont, kicker, inkBorder, card } from '@/lib/cm'

// Cada examen se distingue por una franja superior en la escala morado →
// magenta del manual, no por el fondo entero: los datos mandan, el color
// solo identifica.
const EXAM_TYPES = [
  { id: 'unal',    label: 'Univ. Nacional',  pais: 'COLOMBIA', ac: '#71367F' },
  { id: 'ubosque', label: 'Univ. Bosque',    pais: 'COLOMBIA', ac: '#C9376B' },
  { id: 'urosario',label: 'Univ. Rosario',   pais: 'COLOMBIA', ac: '#663D88' },
  { id: 'uces',    label: 'Univ. CES',       pais: 'COLOMBIA', ac: '#AF296D' },
  { id: 'udea',    label: 'Univ. Antioquia', pais: 'COLOMBIA', ac: '#442C71' },
  { id: 'mir',     label: 'Examen MIR',      pais: 'ESPAÑA',   ac: '#9B2461' },
  { id: 'enarm',   label: 'Examen ENARM',    pais: 'MÉXICO',   ac: '#8D63A6' },
] as const

export default function DashboardPage() {
  const { user } = useAuth()
  const { progresoGlobal, debilidades, historial, universidades, sesionesPorExamen, loading } = useProgreso()

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ height: 48, background: C.cream2, borderRadius: R.md, width: 280 }} />
        <div className="grid-stats" style={{ gap: 0, ...card, overflow: 'hidden' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ height: 140, background: C.cream2, borderRight: i < 2 ? inkBorder : undefined }} className="skeleton" />
          ))}
        </div>
      </div>
    )
  }

  const porcentajeGlobal = progresoGlobal?.porcentaje ?? 0
  const totalRespondidas = progresoGlobal?.total ?? 0
  const totalCorrectas = progresoGlobal?.correctas ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: inkBorder, paddingBottom: 32, marginBottom: 48 }}>
        <div style={{ ...kicker(), marginBottom: 16 }}>PANEL DE CONTROL</div>
        <h1 style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 4rem)', margin: 0, marginBottom: 8 }}>
          Bienvenido de vuelta.
        </h1>
        <p style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink2, margin: 0 }}>
          {user?.email}
        </p>
      </div>

      {/* ─── EXAM TYPES ─────────────────────────────────────────────────────── */}
      <div style={{ ...card, overflow: 'hidden', marginBottom: 48 }}>
        <div style={{ borderBottom: inkBorder, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ ...kicker() }}>ELIGE TU EXAMEN</div>
          <span style={{ ...mono, fontSize: 10, color: C.ink2, letterSpacing: '0.08em' }}>7 EXÁMENES DISPONIBLES</span>
        </div>
        <div className="grid-exam-types">
          {EXAM_TYPES.map((exam, i) => (
            <Link
              key={exam.id}
              href={`/simulacro?examen=${exam.id}`}
              style={{
                ...bodyFont,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 20px',
                background: C.card,
                borderRight: i < EXAM_TYPES.length - 1 ? inkBorder : undefined,
                textDecoration: 'none',
                color: C.ink,
                gap: 10,
                minHeight: 120,
              }}
            >
              <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: exam.ac }} />
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', color: C.ink2 }}>{exam.pais}</div>
              <div style={{ ...disp, fontSize: 'clamp(0.9rem, 1.2vw, 1.25rem)' }}>{exam.label}</div>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', color: exam.ac, marginTop: 'auto' }}>SIMULACRO →</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── STAT CELLS ─────────────────────────────────────────────────────── */}
      {/* Solo la métrica principal lleva el degradado de marca; las otras dos
          bajan a tinte para no competir entre sí. */}
      <div className="grid-stats" style={{ ...card, overflow: 'hidden', marginBottom: 48 }}>
        <div style={{ background: G.brandVivid, color: '#FFFFFF', padding: '36px 32px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 5rem)', lineHeight: 1 }}>{porcentajeGlobal}%</div>
          <div style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', marginTop: 14 }}>ACIERTOS GLOBAL</div>
        </div>
        <div style={{ background: C.purpleSoft, color: C.purpleDeep, borderRight: inkBorder, borderLeft: inkBorder, padding: '36px 32px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 5rem)', lineHeight: 1 }}>{totalCorrectas}</div>
          <div style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', marginTop: 14 }}>RESPUESTAS CORRECTAS</div>
        </div>
        <div style={{ background: C.pinkSoft, color: '#9B2461', padding: '36px 32px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 5rem)', lineHeight: 1 }}>{totalRespondidas}</div>
          <div style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', marginTop: 14 }}>PREGUNTAS RESPONDIDAS</div>
        </div>
      </div>

      {/* ─── RANKING POR TIPO DE EXAMEN ─────────────────────────────────── */}
      {universidades.length > 0 && (() => {
        const univMap: Record<string, { ac: string; label: string }> = {
          'MIR':       { ac: '#9B2461', label: 'EXAMEN MIR'      },
          'ENARM':     { ac: '#8D63A6', label: 'EXAMEN ENARM'    },
          'UNAL':      { ac: '#71367F', label: 'UNIV. NACIONAL'  },
          'El Bosque': { ac: '#C9376B', label: 'UNIV. BOSQUE'    },
          'Rosario':   { ac: '#663D88', label: 'UNIV. ROSARIO'   },
          'CES':       { ac: '#AF296D', label: 'UNIV. CES'       },
          'UdeA':      { ac: '#442C71', label: 'UNIV. ANTIOQUIA' },
        }
        const sorted = [...universidades].sort((a, b) => b.porcentaje - a.porcentaje)
        const best = sorted[0]
        const bestStyle = univMap[best.universidad] || { ac: C.purple, label: best.universidad.toUpperCase() }

        return (
          <div style={{ ...card, overflow: 'hidden', marginBottom: 48 }}>
            <div style={{ borderBottom: inkBorder, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ ...kicker() }}>RANKING POR TIPO DE EXAMEN</div>
              <span style={{ ...mono, fontSize: 10, color: C.ink2, letterSpacing: '0.08em' }}>
                ORDENADO POR % DE ACIERTOS
              </span>
            </div>

            {/* Recommendation banner */}
            <div style={{
              padding: '20px 24px',
              background: G.brandVivid,
              color: '#FFFFFF',
              borderBottom: inkBorder,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ ...disp, fontSize: 24, lineHeight: 1 }}>★</span>
              <div>
                <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em' }}>
                  TU MAYOR PROBABILIDAD DE PASAR A RESIDENCIA ES EN <strong style={{ ...disp, fontSize: 14 }}>{bestStyle.label}</strong> CON <strong style={{ ...disp, fontSize: 14 }}>{best.porcentaje}%</strong> DE ACIERTOS
                </div>
              </div>
            </div>

            {/* Ranked list */}
            {sorted.map((u, i) => {
              const style = univMap[u.universidad] || { ac: C.purple, label: u.universidad.toUpperCase() }
              return (
                <div
                  key={u.universidad}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '18px 24px',
                    borderBottom: i < sorted.length - 1 ? inkBorder : undefined,
                    gap: 16,
                  }}
                >
                  <div style={{
                    ...disp,
                    fontSize: 26,
                    width: 40,
                    textAlign: 'center',
                    color: i === 0 ? C.purple : C.ink2,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: style.ac,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...mono, fontSize: 12, letterSpacing: '0.06em' }}>{style.label}</div>
                    <div style={{ ...mono, fontSize: 10, color: C.ink2, letterSpacing: '0.04em', marginTop: 2 }}>
                      {u.correctas}/{u.total} correctas
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ width: 80, height: 6, background: C.cream2, borderRadius: R.pill, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${u.porcentaje}%`, borderRadius: R.pill, background: u.porcentaje >= 60 ? C.green : u.porcentaje >= 40 ? C.warning : C.magenta }} />
                    </div>
                    <div style={{ ...disp, fontSize: 22, color: u.porcentaje >= 60 ? C.greenDark : u.porcentaje >= 40 ? C.warning : C.magenta, minWidth: 50, textAlign: 'right' }}>
                      {u.porcentaje}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ─── GRÁFICAS POR TIPO DE EXAMEN ──────────────────────────────────── */}
      {(universidades.length > 0 || sesionesPorExamen.length > 0) && (
        <DashboardCharts universidades={universidades} sesionesPorExamen={sesionesPorExamen} />
      )}

      {/* ─── MAIN GRID ──────────────────────────────────────────────────────── */}
      <div className="grid-2fr-3fr" style={{ gap: 0, ...card, overflow: 'hidden', marginBottom: 48 }}>

        {/* LEFT: Actions */}
        <div style={{ borderRight: inkBorder, display: 'flex', flexDirection: 'column' }}>
          {/* Simulacro CTA */}
          <Link
            href="/simulacro"
            style={{
              ...bodyFont,
              display: 'block',
              padding: '40px 32px',
              background: G.ink,
              color: '#FFFFFF',
              textDecoration: 'none',
              borderBottom: inkBorder,
            }}
          >
            <div style={{ ...mono, fontSize: 11, letterSpacing: '0.14em', opacity: 0.65, marginBottom: 16 }}>
              ACCIÓN PRINCIPAL
            </div>
            <div style={{ ...disp, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', marginBottom: 12 }}>
              Nuevo simulacro →
            </div>
            <p style={{ ...bodyFont, fontSize: 15, opacity: 0.78, margin: 0 }}>
              20 preguntas aleatorias por examen
            </p>
          </Link>

          {/* Specialties */}
          <div style={{ padding: '32px', flex: 1 }}>
            <div style={{ ...kicker(), marginBottom: 20 }}>POR ESPECIALIDAD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(progresoGlobal?.porEspecialidad?.slice(0, 8) || []).map((esp, i) => (
                <Link
                  key={esp.especialidad}
                  href={`/simulacro?especialidad=${encodeURIComponent(esp.especialidad)}`}
                  style={{
                    ...bodyFont,
                    fontSize: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: i < 7 ? inkBorder : undefined,
                    color: C.ink,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {esp.especialidad}
                  </span>
                  <span style={{ ...mono, fontSize: 12, color: esp.porcentaje >= 60 ? C.greenDark : C.magenta, marginLeft: 8, flexShrink: 0 }}>
                    {esp.porcentaje}%
                  </span>
                </Link>
              ))}
              {(progresoGlobal?.porEspecialidad?.length || 0) === 0 && (
                <p style={{ ...bodyFont, fontSize: 14, color: C.ink2 }}>Haz tu primer simulacro para ver estadísticas</p>
              )}
            </div>
            <Link href="/especialidades" style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', display: 'block', marginTop: 20, color: C.purple, textDecoration: 'none' }}>
              VER TODAS →
            </Link>
          </div>
        </div>

        {/* RIGHT: Progress */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Progress bars */}
          <div style={{ padding: '32px', borderBottom: inkBorder }}>
            <div style={{ ...kicker(), marginBottom: 20 }}>PROGRESO POR ESPECIALIDAD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(progresoGlobal?.porEspecialidad?.slice(0, 6) || []).map(esp => (
                <div key={esp.especialidad}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ ...bodyFont, fontSize: 14, fontWeight: 500 }}>{esp.especialidad}</span>
                    <span style={{ ...mono, fontSize: 11, letterSpacing: '0.06em', color: esp.porcentaje >= 60 ? C.greenDark : C.magenta }}>
                      {esp.porcentaje}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: C.cream2, borderRadius: R.pill, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${esp.porcentaje}%`,
                        borderRadius: R.pill,
                        background: esp.porcentaje >= 60 ? C.green : G.brand,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
              {(progresoGlobal?.porEspecialidad?.length || 0) === 0 && (
                <p style={{ ...bodyFont, fontSize: 14, color: C.ink2, margin: 0 }}>Sin datos todavía</p>
              )}
            </div>
          </div>

          {/* Weaknesses */}
          {debilidades.length > 0 && (
            <div style={{ padding: '32px', borderBottom: inkBorder }}>
              <div style={{ ...kicker(), marginBottom: 20 }}>PUNTOS DÉBILES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {debilidades.slice(0, 5).map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px',
                      background: C.pinkSoft,
                      borderRadius: R.md,
                    }}
                  >
                    <div>
                      <span style={{ ...bodyFont, fontSize: 14, fontWeight: 500 }}>{d.tema}</span>
                      <span style={{ ...mono, fontSize: 10, letterSpacing: '0.04em', color: C.ink2, marginLeft: 10 }}>{d.especialidad}</span>
                    </div>
                    <span style={{ ...disp, fontSize: 18, color: '#9B2461' }}>{d.porcentaje}%</span>
                  </div>
                ))}
              </div>
              <Link
                href="/simulacro?tipo=repaso_errores"
                style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', display: 'block', marginTop: 16, border: `1px solid ${C.magenta}`, borderRadius: R.sm, padding: '12px 16px', color: C.magenta, textDecoration: 'none', textAlign: 'center' }}
              >
                REPASAR MIS ERRORES →
              </Link>
            </div>
          )}

          {/* History */}
          {historial.length > 0 && (
            <div style={{ padding: '32px' }}>
              <div style={{ ...kicker(), marginBottom: 20 }}>ÚLTIMOS SIMULACROS</div>
              <div style={{ border: inkBorder, borderRadius: R.md, overflow: 'hidden', boxShadow: S.xs }}>
                {historial.slice(0, 5).map((h, i) => {
                  const pct = h.total > 0 ? Math.round(((h.score ?? 0) / h.total) * 100) : 0
                  return (
                    <div
                      key={h.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 18px',
                        borderBottom: i < historial.slice(0,5).length - 1 ? inkBorder : undefined,
                      }}
                    >
                      <div>
                        <span style={{ ...bodyFont, fontSize: 14, fontWeight: 500 }}>
                        {h.universidad || h.filtro || 'Aleatorio'}
                      </span>
                        <span style={{ ...mono, fontSize: 10, color: C.ink2, marginLeft: 10, letterSpacing: '0.04em' }}>
                          {new Date(h.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <span style={{ ...disp, fontSize: 20, color: pct >= 60 ? C.greenDark : C.magenta }}>
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
