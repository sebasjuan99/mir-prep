'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useProgreso } from '@/hooks/useProgreso'
import { C, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'

const EXAM_TYPES = [
  { id: 'unal',    label: 'UNIV. NACIONAL',  pais: 'COLOMBIA', bg: C.green,   color: C.cream },
  { id: 'ubosque', label: 'UNIV. BOSQUE',    pais: 'COLOMBIA', bg: C.cream2,  color: C.ink   },
  { id: 'urosario',label: 'UNIV. ROSARIO',   pais: 'COLOMBIA', bg: C.orange,  color: C.cream },
  { id: 'mir',     label: 'EXAMEN MIR',      pais: 'ESPAÑA',   bg: C.ink,     color: C.cream },
  { id: 'enarm',   label: 'EXAMEN ENARM',    pais: 'MÉXICO',   bg: C.pink,    color: C.ink   },
] as const

export default function DashboardPage() {
  const { user } = useAuth()
  const { progresoGlobal, debilidades, historial, universidades, loading } = useProgreso()

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ height: 48, background: C.cream2, border: inkBorder, width: 280 }} />
        <div className="grid-stats" style={{ gap: 0, border: inkBorder }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ height: 140, background: i === 0 ? C.green : i === 1 ? C.pink : C.orange, borderRight: i < 2 ? inkBorder : undefined }} className="skeleton" />
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
        <h1 style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 4.5rem)', margin: 0, marginBottom: 8 }}>
          BIENVENIDO<br />DE VUELTA.
        </h1>
        <p style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink2, margin: 0 }}>
          {user?.email}
        </p>
      </div>

      {/* ─── EXAM TYPES ─────────────────────────────────────────────────────── */}
      <div style={{ border: inkBorder, marginBottom: 48 }}>
        <div style={{ borderBottom: inkBorder, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ ...kicker() }}>ELIGE TU EXAMEN</div>
          <span style={{ ...mono, fontSize: 10, color: C.ink2, letterSpacing: '0.08em' }}>5 EXÁMENES DISPONIBLES</span>
        </div>
        <div className="grid-exam-types">
          {EXAM_TYPES.map((exam, i) => (
            <Link
              key={exam.id}
              href={`/simulacro?examen=${exam.id}`}
              style={{
                ...bodyFont,
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 20px',
                background: exam.bg,
                borderRight: i < EXAM_TYPES.length - 1 ? inkBorder : undefined,
                textDecoration: 'none',
                color: exam.color,
                gap: 10,
                minHeight: 120,
              }}
            >
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', opacity: 0.65 }}>{exam.pais}</div>
              <div style={{ ...disp, fontSize: 'clamp(0.85rem, 1.2vw, 1.3rem)', lineHeight: 0.95 }}>{exam.label}</div>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.1em', opacity: 0.55, marginTop: 'auto' }}>SIMULACRO →</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── STAT CELLS ─────────────────────────────────────────────────────── */}
      <div className="grid-stats" style={{ border: inkBorder, marginBottom: 48 }}>
        <div style={{ background: C.green, color: C.cream, borderRight: inkBorder, padding: '36px 32px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 6rem)', lineHeight: 0.88 }}>{porcentajeGlobal}%</div>
          <div style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', marginTop: 14 }}>ACIERTOS GLOBAL</div>
        </div>
        <div style={{ background: C.pink, color: C.ink, borderRight: inkBorder, padding: '36px 32px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 6rem)', lineHeight: 0.88 }}>{totalCorrectas}</div>
          <div style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', marginTop: 14 }}>RESPUESTAS CORRECTAS</div>
        </div>
        <div style={{ background: C.orange, color: C.cream, padding: '36px 32px' }}>
          <div style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 6rem)', lineHeight: 0.88 }}>{totalRespondidas}</div>
          <div style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', marginTop: 14 }}>PREGUNTAS RESPONDIDAS</div>
        </div>
      </div>

      {/* ─── PROBABILIDAD POR UNIVERSIDAD ──────────────────────────────────── */}
      {universidades.length > 0 && (
        <div style={{ border: inkBorder, marginBottom: 48 }}>
          <div style={{ borderBottom: inkBorder, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ ...kicker() }}>PROBABILIDAD POR UNIVERSIDAD</div>
            <span style={{ ...mono, fontSize: 10, color: C.ink2, letterSpacing: '0.08em' }}>
              BASADO EN TU HISTORIAL DE RESPUESTAS
            </span>
          </div>
          <div className="grid-univ">
            {universidades.map((u, i) => {
              const univMap: Record<string, { bg: string; color: string; label: string }> = {
                'MIR':       { bg: C.ink,    color: C.cream, label: 'EXAMEN MIR'     },
                'ENARM':     { bg: C.pink,   color: C.ink,   label: 'EXAMEN ENARM'   },
                'UNAL':      { bg: C.green,  color: C.cream, label: 'UNIV. NACIONAL' },
                'El Bosque': { bg: C.cream2, color: C.ink,   label: 'UNIV. BOSQUE'   },
                'Rosario':   { bg: C.orange, color: C.cream, label: 'UNIV. ROSARIO'  },
              }
              const style = univMap[u.universidad] || { bg: C.cream2, color: C.ink, label: u.universidad.toUpperCase() }
              return (
                <div
                  key={u.universidad}
                  style={{
                    padding: '28px 24px',
                    background: style.bg,
                    borderRight: i < universidades.length - 1 ? inkBorder : undefined,
                  }}
                >
                  <div style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', color: style.color, opacity: 0.6, marginBottom: 8 }}>
                    {style.label}
                  </div>
                  <div style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: style.color, lineHeight: 0.9, marginBottom: 10 }}>
                    {u.porcentaje}%
                  </div>
                  <div style={{ height: 4, background: 'rgba(0,0,0,0.1)', border: `2px solid ${style.color}`, opacity: 0.4 }}>
                    <div style={{ height: '100%', width: `${u.porcentaje}%`, background: style.color }} />
                  </div>
                  <div style={{ ...mono, fontSize: 9, letterSpacing: '0.08em', color: style.color, opacity: 0.5, marginTop: 8 }}>
                    {u.correctas}/{u.total} CORRECTAS
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── MAIN GRID ──────────────────────────────────────────────────────── */}
      <div className="grid-2fr-3fr" style={{ gap: 0, border: inkBorder, marginBottom: 48 }}>

        {/* LEFT: Actions */}
        <div style={{ borderRight: inkBorder, display: 'flex', flexDirection: 'column' }}>
          {/* Simulacro CTA */}
          <Link
            href="/simulacro"
            style={{
              ...bodyFont,
              display: 'block',
              padding: '40px 32px',
              background: C.ink,
              color: C.cream,
              textDecoration: 'none',
              borderBottom: inkBorder,
            }}
          >
            <div style={{ ...mono, fontSize: 11, letterSpacing: '0.14em', color: C.cream, opacity: 0.6, marginBottom: 16 }}>
              ACCIÓN PRINCIPAL
            </div>
            <div style={{ ...disp, fontSize: 'clamp(1.8rem, 3vw, 3rem)', marginBottom: 12 }}>
              NUEVO<br />SIMULACRO →
            </div>
            <p style={{ ...bodyFont, fontSize: 15, color: C.cream, opacity: 0.75, margin: 0 }}>
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
                    ...mono,
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: i < 7 ? `1px solid ${C.cream2}` : undefined,
                    color: C.ink,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {esp.especialidad}
                  </span>
                  <span style={{ color: esp.porcentaje >= 60 ? C.green : C.pink, marginLeft: 8, flexShrink: 0 }}>
                    {esp.porcentaje}%
                  </span>
                </Link>
              ))}
              {(progresoGlobal?.porEspecialidad?.length || 0) === 0 && (
                <p style={{ ...bodyFont, fontSize: 14, color: C.ink2 }}>Haz tu primer simulacro para ver estadísticas</p>
              )}
            </div>
            <Link href="/especialidades" style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', display: 'block', marginTop: 20, color: C.ink, textDecoration: 'underline' }}>
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
                    <span style={{ ...mono, fontSize: 11, letterSpacing: '0.06em' }}>{esp.especialidad}</span>
                    <span style={{ ...mono, fontSize: 11, letterSpacing: '0.06em', color: esp.porcentaje >= 60 ? C.green : C.pink }}>
                      {esp.porcentaje}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: C.cream2, border: `2px solid ${C.ink}` }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${esp.porcentaje}%`,
                        background: esp.porcentaje >= 60 ? C.green : C.pink,
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
              <div style={{ ...kicker(C.pink, C.ink), marginBottom: 20 }}>PUNTOS DÉBILES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {debilidades.slice(0, 5).map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px',
                      background: C.cream2,
                      borderBottom: i < 4 ? inkBorder : undefined,
                      border: i === 0 ? inkBorder : undefined,
                      borderTop: i > 0 ? 'none' : undefined,
                    }}
                  >
                    <div>
                      <span style={{ ...mono, fontSize: 11, letterSpacing: '0.06em' }}>{d.tema}</span>
                      <span style={{ ...mono, fontSize: 10, letterSpacing: '0.04em', color: C.ink2, marginLeft: 10 }}>{d.especialidad}</span>
                    </div>
                    <span style={{ ...disp, fontSize: 18, color: C.pink }}>{d.porcentaje}%</span>
                  </div>
                ))}
              </div>
              <Link
                href="/simulacro?tipo=repaso_errores"
                style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', display: 'block', marginTop: 16, border: `2px solid ${C.pink}`, padding: '10px 16px', color: C.pink, textDecoration: 'none', textAlign: 'center' }}
              >
                REPASAR MIS ERRORES →
              </Link>
            </div>
          )}

          {/* History */}
          {historial.length > 0 && (
            <div style={{ padding: '32px' }}>
              <div style={{ ...kicker(), marginBottom: 20 }}>ÚLTIMOS SIMULACROS</div>
              <div style={{ border: inkBorder }}>
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
                        <span style={{ ...mono, fontSize: 11, letterSpacing: '0.06em' }}>
                        {h.universidad || h.filtro || 'ALEATORIO'}
                      </span>
                        <span style={{ ...mono, fontSize: 10, color: C.ink2, marginLeft: 10, letterSpacing: '0.04em' }}>
                          {new Date(h.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <span style={{ ...disp, fontSize: 20, color: pct >= 60 ? C.green : C.pink }}>
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
