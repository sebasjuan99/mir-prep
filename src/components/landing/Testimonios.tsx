'use client'

import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import { C, G, R, S, disp, bodyFont, mono, inkBorder } from '@/lib/cm'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'
import { TESTIMONIALS, type Testimonial } from './config'

// ── Tarjeta de testimonio (texto o video) ──────────────────────────────────
function Card({ t, onPlay }: { t: Testimonial; onPlay: (t: Testimonial) => void }) {
  const [hover, setHover] = useState(false)
  const cardStyle: CSSProperties = {
    width: 320,
    flexShrink: 0,
    border: inkBorder,
    borderRadius: R.lg,
    background: C.card,
    padding: 24,
    transform: hover ? 'translateY(-4px) rotate(-0.6deg)' : 'none',
    boxShadow: hover ? S.lg : S.sm,
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  }

  return (
    <div
      className="lp-marquee-card"
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: inkBorder, background: C.purpleSoft, flexShrink: 0, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {t.foto && <img src={t.foto} alt={t.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...disp, fontSize: 16 }}>{t.nombre}</div>
          <span style={{ ...mono, fontSize: 10, letterSpacing: '0.06em', background: C.purpleSoft, color: C.purple, borderRadius: R.pill, padding: '3px 10px', display: 'inline-block', marginTop: 4 }}>
            {t.detalle}
          </span>
        </div>
      </div>

      {t.tipo === 'video' ? (
        <button
          onClick={() => onPlay(t)}
          aria-label={`Ver video testimonio de ${t.nombre}`}
          style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', border: inkBorder, borderRadius: R.md, background: C.ink, cursor: 'pointer', padding: 0, overflow: 'hidden' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {t.poster && <img src={t.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <span style={{ width: 54, height: 54, borderRadius: '50%', background: G.brandVivid, boxShadow: S.brand, display: 'grid', placeItems: 'center', ...disp, fontSize: 20, color: '#FFFFFF' }}>▶</span>
          </span>
        </button>
      ) : (
        <p style={{ ...bodyFont, fontSize: 16, lineHeight: 1.5, margin: 0, color: C.ink }}>
          <span style={{ ...disp, color: C.magenta, fontSize: 28, lineHeight: 0, verticalAlign: '-0.35em', marginRight: 4 }}>“</span>
          {t.quote}
        </p>
      )}
    </div>
  )
}

// ── Estado alterno por evidencia (4.7) — se muestra si no hay testimonios ────
function EvidenceState() {
  return (
    <Reveal>
      <div style={{ borderRadius: R.lg, background: G.ink, color: '#FFFFFF', boxShadow: S.lg, padding: 'clamp(32px, 5vw, 64px)' }}>
        <div style={{ ...mono, fontSize: 12, letterSpacing: '0.14em', background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', borderRadius: R.pill, padding: '6px 14px', display: 'inline-block', marginBottom: 24 }}>
          PRUEBA SOCIAL POR EVIDENCIA
        </div>
        <h3 style={{ ...disp, fontSize: 'clamp(1.5rem, 3.4vw, 2.8rem)', margin: 0, marginBottom: 20 }}>
          No es una moda. <span style={{ color: '#E47BA0' }}>Es cómo funciona la memoria.</span>
        </h3>
        <p style={{ ...bodyFont, fontSize: 'clamp(16px, 1.3vw, 21px)', lineHeight: 1.65, margin: 0, maxWidth: 720, color: 'rgba(255,255,255,0.86)' }}>
          El método detrás de proximoresidente.com —la práctica de recuperación— es uno de los hallazgos más consistentes
          de la investigación en aprendizaje de las últimas décadas. No te pedimos que nos creas: estudia como la evidencia
          ya demostró que funciona.
        </p>
      </div>
    </Reveal>
  )
}

// ── Modal de video (lightbox) ───────────────────────────────────────────────
function VideoModal({ t, onClose }: { t: Testimonial; onClose: () => void }) {
  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }, [onClose])
  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Video testimonio de ${t.nombre}`}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,27,31,0.88)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(92vw, 460px)', borderRadius: R.lg, overflow: 'hidden', boxShadow: S.lg }}>
        <video src={t.videoSrc} poster={t.poster} controls autoPlay playsInline style={{ width: '100%', display: 'block' }}>
          {/* La pista de subtítulos real se añade cuando exista el testimonio */}
        </video>
      </div>
      <button
        onClick={onClose}
        aria-label="Cerrar video"
        style={{ position: 'fixed', top: 20, right: 20, ...mono, fontSize: 13, background: '#FFFFFF', color: C.ink, border: 'none', borderRadius: R.sm, padding: '10px 16px', cursor: 'pointer' }}
      >
        CERRAR ✕
      </button>
    </div>
  )
}

export default function Testimonios() {
  const [active, setActive] = useState<Testimonial | null>(null)
  const hasReal = TESTIMONIALS.length > 0

  return (
    <section style={{ background: C.cream2, borderBottom: inkBorder, padding: 'clamp(48px, 7vw, 80px) 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' }}>
        <SectionHeader num="05" title="Médicos que dejaron de estudiar a ciegas" />
      </div>

      {hasReal ? (
        <>
          {/* Rail animado: se duplica la lista para el bucle continuo */}
          <div className="lp-marquee" style={{ paddingBottom: 8 }}>
            <div className="lp-marquee-track" style={{ padding: '12px clamp(16px, 4vw, 40px)' }}>
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <Card key={i} t={t} onPlay={setActive} />
              ))}
            </div>
          </div>
          {active && <VideoModal t={active} onClose={() => setActive(null)} />}
        </>
      ) : (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' }}>
          <EvidenceState />
        </div>
      )}
    </section>
  )
}
