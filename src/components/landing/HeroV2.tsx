import { C, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'
import Reveal from './Reveal'
import CtaButton from './CtaButton'
import VideoSlot from './VideoSlot'
import { HEADLINE_VARIANT, HEADLINES, HERO_SUBTITLE, TRUST_LINE } from './config'

export default function HeroV2() {
  const headline = HEADLINES[HEADLINE_VARIANT]

  return (
    <section style={{ background: C.cream, borderBottom: inkBorder, overflow: 'hidden' }}>
      <div
        className="lp-hero"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: 'clamp(48px, 7vw, 88px) clamp(16px, 4vw, 40px) clamp(40px, 5vw, 64px)',
        }}
      >
        {/* Columna de texto */}
        <div style={{ minWidth: 0 }}>
          <Reveal>
            <div style={{ ...kicker(), marginBottom: 28 }}>MÉTODO RETRIEVAL PRACTICE · BASADO EN EVIDENCIA</div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1
              style={{
                ...disp,
                fontSize: 'clamp(2rem, 5.6vw, 4.6rem)',
                lineHeight: 1.02,
                margin: 0,
                marginBottom: 28,
                overflowWrap: 'normal',
                wordBreak: 'normal',
                hyphens: 'none',
                textTransform: 'none',
              }}
            >
              {headline.parts.map((p, i) => (
                <span key={i} style={p.accent ? { color: C.pink } : undefined}>
                  {p.text}
                </span>
              ))}
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p
              style={{
                ...bodyFont,
                fontSize: 'clamp(16px, 1.15vw, 20px)',
                lineHeight: 1.55,
                maxWidth: 540,
                margin: 0,
                marginBottom: 36,
                color: C.ink2,
              }}
            >
              {HERO_SUBTITLE.split(/(retrieval practice)/i).map((seg, i) =>
                /^retrieval practice$/i.test(seg) ? (
                  <strong key={i} style={{ fontWeight: 700, color: C.ink }}>
                    {seg}
                  </strong>
                ) : (
                  seg
                ),
              )}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <CtaButton showMicrocopy align="left" />
          </Reveal>
        </div>

        {/* Columna del reel vertical (SLOT VIDEO: HERO) */}
        <Reveal delay={0.1} className="lp-hero-media">
          <div style={{ position: 'relative', width: '100%', maxWidth: 300, margin: '0 auto' }}>
            <span
              aria-hidden
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: '0.14em',
                background: C.pink,
                color: C.ink,
                border: inkBorder,
                padding: '4px 10px',
                position: 'absolute',
                top: -14,
                left: -8,
                zIndex: 2,
              }}
            >
              REEL
            </span>
            <div style={{ boxShadow: `12px 12px 0 ${C.yellow}, 12px 12px 0 4px ${C.ink}` }}>
              <VideoSlot
                id="HERO"
                aspectRatio="9 / 16"
                mode="loop"
                placeholder="Subir video del hero aquí (loop 8-15s, muted). Dr. Alba con el gancho o loop de la plataforma."
                label="Video de presentación de Próximo Residente"
              />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Barra de confianza */}
      <div style={{ borderTop: inkBorder, background: C.cream2 }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '14px clamp(16px, 4vw, 40px)',
            ...mono,
            fontSize: 'clamp(10px, 1.6vw, 12px)',
            letterSpacing: '0.06em',
            color: C.ink2,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          {TRUST_LINE}
        </div>
      </div>
    </section>
  )
}
