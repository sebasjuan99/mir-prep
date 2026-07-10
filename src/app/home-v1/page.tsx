import Link from 'next/link'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { Metadata } from 'next'

// Versión archivada de la home v1 (respaldo). No debe indexarse ni competir
// en SEO con la home actual: noindex + canonical propio.
export const metadata: Metadata = {
  title: 'Home v1 (archivo) — Próximo Residente',
  alternates: { canonical: '/home-v1' },
  robots: { index: false, follow: false },
}

// Datos estructurados (JSON-LD) para que Google entienda qué es el sitio.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Próximo Residente',
  url: 'https://www.proximoresidente.com',
  logo: 'https://www.proximoresidente.com/ape-logo-negro.png',
  description:
    'Plataforma de simulacros para el examen de residencia médica (MIR, ENARM y universidades de Colombia) con retroalimentación pedagógica y fichas de estudio por especialidad.',
}

// ─── Creative Mode design tokens ────────────────────────────────────────────
const C = {
  cream: '#EFE9D9',
  cream2: '#E4DCC4',
  ink: '#0F0F0F',
  ink2: '#2A2A2A',
  green: '#1F8A4C',
  greenDark: '#136636',
  pink: '#F06CA8',
  orange: '#E85A1F',
  yellow: '#F5C518',
} as const

const disp: CSSProperties = {
  fontFamily: "var(--font-archivo, 'Archivo Black', sans-serif)",
  textTransform: 'uppercase',
  lineHeight: 0.92,
  letterSpacing: '-0.01em',
}
const mono: CSSProperties = {
  fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
  textTransform: 'uppercase',
}
const bodyFont: CSSProperties = {
  fontFamily: "var(--font-grotesk, 'Space Grotesk', sans-serif)",
}

const kicker = (bg = C.ink, color = C.cream): CSSProperties => ({
  ...mono,
  fontSize: 13,
  letterSpacing: '0.14em',
  background: bg,
  color,
  padding: '8px 16px',
  display: 'inline-block',
})

const dot = (color: string = C.ink): CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: color,
  margin: '0 8px',
  verticalAlign: 'middle',
})

export default function LandingV1() {
  return (
    <div style={{ ...bodyFont, background: C.cream, color: C.ink }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── NAV ────────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: `4px solid ${C.ink}`, background: C.cream }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '18px clamp(16px, 4vw, 40px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <Image
              src="/ape-logo-negro.png"
              alt="Aurora Pixel Studio"
              width={56}
              height={56}
              style={{ objectFit: 'contain', flexShrink: 0 }}
            />
            <span className="hidden sm:inline" style={{ ...mono, fontSize: 15, letterSpacing: '0.1em' }}>Próximo Residente</span>
          </div>
          <nav style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
            <Link
              href="/login"
              style={{
                ...mono, fontSize: 'clamp(10px, 2.6vw, 12px)', letterSpacing: '0.06em',
                padding: '10px clamp(10px, 3vw, 18px)', color: C.ink2, textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              INICIAR SESIÓN
            </Link>
            <Link
              href="/register"
              style={{
                ...mono, fontSize: 'clamp(10px, 2.6vw, 12px)', letterSpacing: '0.06em',
                border: `4px solid ${C.ink}`,
                background: C.ink, color: C.cream,
                padding: '10px clamp(12px, 3vw, 20px)',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              REGISTRARSE
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '90vh', position: 'relative', overflow: 'hidden',
        borderBottom: `4px solid ${C.ink}`,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: 'clamp(60px,10vw,100px) clamp(16px,4vw,40px) clamp(80px,12vw,120px)',
          width: '100%', position: 'relative', zIndex: 2,
        }}>
          <div style={{ ...kicker(), marginBottom: 48 }}>EXÁMENES DE RESIDENCIA 2026–2027</div>

          <h1 style={{
            ...disp,
            fontSize: 'clamp(2rem, 10vw, 14rem)',
            margin: 0, marginBottom: 40,
            overflowWrap: 'normal',
            wordBreak: 'normal',
            hyphens: 'none',
          }}>
            APRUEBA<br />
            <span style={{ color: C.pink }}>TU RESIDENCIA.</span>
          </h1>

          <p style={{
            ...bodyFont,
            fontSize: 'clamp(16px, 1.2vw, 22px)',
            lineHeight: 1.5,
            maxWidth: 520,
            marginBottom: 52,
            color: C.ink2,
          }}>
            Simulacros para MIR, ENARM y exámenes universitarios colombianos.
            Retroalimentación inmediata, fichas de estudio y seguimiento de tu progreso por especialidad.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                ...disp, fontSize: 'clamp(14px, 1.1vw, 18px)',
                border: `4px solid ${C.ink}`,
                background: C.ink, color: C.cream,
                padding: '16px 36px',
                textDecoration: 'none',
              }}
            >
              COMENZAR GRATIS →
            </Link>
            <Link
              href="/login"
              style={{
                ...disp, fontSize: 'clamp(14px, 1.1vw, 18px)',
                border: `4px solid ${C.ink}`,
                color: C.ink,
                padding: '16px 36px',
                textDecoration: 'none',
              }}
            >
              YA TENGO CUENTA
            </Link>
          </div>
        </div>

        {/* Stamp — hard offset shadow (one per section) */}
        <div className="landing-stamp" style={{
          position: 'absolute', top: '18%', right: '7%',
          width: 180, height: 180,
          background: C.pink, border: `4px solid ${C.ink}`,
          transform: 'rotate(-6deg)',
          boxShadow: `20px 20px 0 ${C.orange}, 20px 20px 0 4px ${C.ink}`,
          alignItems: 'center', justifyItems: 'center',
          zIndex: 3,
        }}>
          <div style={{
            width: '82%', height: '82%',
            border: `4px solid ${C.ink}`, borderRadius: '50%',
            display: 'grid', alignItems: 'center', justifyItems: 'center',
            textAlign: 'center',
          }}>
            <span style={{ ...disp, fontSize: 22 }}>EXAMEN<br />OFICIAL</span>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="landing-deco" style={{
          position: 'absolute', bottom: -110, left: -110,
          width: 340, height: 340,
          borderRadius: '50%',
          background: C.yellow, border: `4px solid ${C.ink}`,
          zIndex: 1,
        }} />

        {/* Chrome footer */}
        <div style={{
          position: 'absolute', bottom: 20, left: 'clamp(16px,4vw,40px)', right: 'clamp(16px,4vw,40px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          ...mono, fontSize: 12, letterSpacing: '0.08em', color: C.ink2,
          zIndex: 2,
        }}>
          <span>Próximo Residente — Simulacros Interactivos</span>
          <span>
            01
            <span style={dot(C.ink2)} />
            05
          </span>
        </div>
      </section>

      {/* ─── BIG CLAIM ──────────────────────────────────────────────────────── */}
      <section style={{
        background: C.pink,
        borderBottom: `4px solid ${C.ink}`,
        minHeight: '45vh',
        display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Chrome top */}
        <div style={{
          position: 'absolute', top: 20, left: 'clamp(16px,4vw,40px)', right: 'clamp(16px,4vw,40px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          ...mono, fontSize: 12, letterSpacing: '0.08em', color: C.ink,
        }}>
          <span>TESIS CENTRAL</span>
          <span style={{ border: `2px solid ${C.ink}`, borderRadius: 999, padding: '4px 12px' }}>02 — CLAIM</span>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: 'clamp(60px,8vw,80px) clamp(16px,4vw,64px)' }}>
          <div style={{ ...kicker(), marginBottom: 32 }}>LA PREPARACIÓN DEFINITIVA</div>
          <h2 style={{
            ...disp,
            fontSize: 'clamp(2.2rem, 8.5vw, 12rem)',
            color: C.ink,
            maxWidth: '90%',
            margin: 0,
            overflowWrap: 'normal',
            wordBreak: 'normal',
            hyphens: 'none',
          }}>
            PREGUNTA<br />A PREGUNTA.
          </h2>
        </div>

        {/* Chrome bottom */}
        <div style={{
          position: 'absolute', bottom: 20, left: 'clamp(16px,4vw,40px)', right: 'clamp(16px,4vw,40px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          ...mono, fontSize: 12, letterSpacing: '0.08em', color: C.ink,
        }}>
          <span>UNA IDEA / UN FRAME</span>
          <span>02<span style={dot(C.ink)} />05</span>
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `4px solid ${C.ink}`, padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 56, flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.14em', background: C.ink, color: C.cream, padding: '8px 14px' }}>03</span>
            <h2 style={{ ...disp, fontSize: 'clamp(1.8rem, 4vw, 5rem)', margin: 0 }}>LOS NÚMEROS NO MIENTEN</h2>
            <div style={{ flex: 1, minWidth: 16, height: 4, background: C.ink, alignSelf: 'center' }} />
          </div>

          <div className="grid-landing-3" style={{ border: `4px solid ${C.ink}` }}>
            {([
              { n: '1.000+', label: 'PREGUNTAS REALES DE RESIDENCIA', bg: C.green, color: C.cream, br: true },
              { n: '2026',   label: 'CONVOCATORIA ACTIVA',  bg: C.pink,  color: C.ink,  br: true },
              { n: '3×',     label: 'MÁS EFICAZ QUE SOLO LEER', bg: C.orange, color: C.cream, br: false },
            ] as const).map((s) => (
              <div
                key={s.n}
                style={{
                  background: s.bg, color: s.color,
                  borderRight: s.br ? `4px solid ${C.ink}` : undefined,
                  padding: '44px 36px',
                }}
              >
                <div style={{ ...disp, fontSize: 'clamp(3rem, 6.5vw, 8rem)', lineHeight: 0.88 }}>{s.n}</div>
                <div style={{ ...mono, fontSize: 13, letterSpacing: '0.08em', marginTop: 20 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `4px solid ${C.ink}`, padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 56, flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: 13, letterSpacing: '0.14em', background: C.ink, color: C.cream, padding: '8px 14px' }}>04</span>
            <h2 style={{ ...disp, fontSize: 'clamp(1.8rem, 4vw, 5rem)', margin: 0 }}>CÓMO FUNCIONA</h2>
            <div style={{ flex: 1, minWidth: 16, height: 4, background: C.ink, alignSelf: 'center' }} />
          </div>

          <div className="grid-landing-4" style={{ border: `4px solid ${C.ink}` }}>
            {([
              { num: '01', title: 'REGÍSTRATE', desc: 'Crea tu cuenta gratis en segundos. Sin tarjeta.',                         bg: C.cream2, color: C.ink,  br: true  },
              { num: '02', title: 'PRACTICA',   desc: 'Responde preguntas reales clasificadas por especialidad.',                  bg: C.yellow, color: C.ink,  br: true  },
              { num: '03', title: 'REVISA',     desc: 'Recibe fichas de estudio cuando fallas una pregunta.',                     bg: C.pink,   color: C.ink,  br: true  },
              { num: '04', title: 'APRUEBA',    desc: 'Detectamos tus debilidades. Llega a tu examen de residencia con una preparación de verdad.', bg: C.green,  color: C.cream, br: false },
            ] as const).map((step) => (
              <div
                key={step.num}
                style={{
                  background: step.bg, color: step.color,
                  borderRight: step.br ? `4px solid ${C.ink}` : undefined,
                  padding: '32px 28px',
                  minHeight: 300,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}
              >
                <div style={{ ...disp, fontSize: 'clamp(4rem, 7vw, 9rem)', lineHeight: 0.85, opacity: 0.8 }}>{step.num}</div>
                <div>
                  <div style={{ ...disp, fontSize: 'clamp(18px, 1.5vw, 26px)', marginBottom: 12 }}>{step.title}</div>
                  <p style={{ ...bodyFont, fontSize: 16, lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED MARKER ────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `4px solid ${C.ink}`, padding: 'clamp(48px,7vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 80, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Marker block — the one hard-shadow element of this section */}
          <div style={{
            ...disp,
            background: C.pink, border: `4px solid ${C.ink}`,
            padding: '36px 44px',
            fontSize: 'clamp(1.8rem, 3.5vw, 4.5rem)',
            boxShadow: `24px 24px 0 ${C.orange}, 24px 24px 0 4px ${C.ink}`,
            marginBottom: 30, marginRight: 30,
          }}>
            RETROALIMENTACIÓN<br />INMEDIATA.
          </div>

          <div style={{ flex: 1, minWidth: 280, paddingTop: 8 }}>
            <div style={{ ...kicker(), marginBottom: 24 }}>CÓMO APRENDEMOS MEJOR</div>
            <p style={{
              ...bodyFont,
              fontSize: 'clamp(16px, 1.2vw, 22px)',
              lineHeight: 1.55,
              color: C.ink2,
              maxWidth: 480,
              margin: 0,
            }}>
              Cuando fallas una pregunta, Próximo Residente genera una ficha de
              estudio personalizada con los conceptos clave del tema. Mide tu
              rendimiento, descubre con qué universidad y tipo de preguntas tienes
              más afinidad, y aumenta tus probabilidades de pasar a la residencia.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CLOSING (green ground) ─────────────────────────────────────────── */}
      <section style={{
        background: C.green,
        borderBottom: `4px solid ${C.ink}`,
        minHeight: '60vh',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Chrome top */}
        <div style={{
          position: 'absolute', top: 20, left: 'clamp(16px,4vw,40px)', right: 'clamp(16px,4vw,40px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          ...mono, fontSize: 12, letterSpacing: '0.08em', color: C.cream,
        }}>
          <span>Próximo Residente</span>
          <span style={{ border: `2px solid ${C.cream}`, borderRadius: 999, padding: '4px 12px' }}>05 — CIERRE</span>
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: 'clamp(60px,8vw,80px) clamp(16px,4vw,40px)' }}>
          <h2 style={{ ...disp, fontSize: 'clamp(2.6rem, 11vw, 14rem)', color: C.cream, margin: 0, marginBottom: 56, overflowWrap: 'normal', wordBreak: 'normal', hyphens: 'none' }}>
            EMPIEZA<br />HOY.
          </h2>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                ...disp, fontSize: 'clamp(14px, 1.1vw, 18px)',
                border: `4px solid ${C.cream}`,
                background: C.cream, color: C.ink,
                padding: '16px 36px',
                textDecoration: 'none',
              }}
            >
              CREAR CUENTA GRATIS →
            </Link>
            <Link
              href="/login"
              style={{
                ...disp, fontSize: 'clamp(14px, 1.1vw, 18px)',
                border: `4px solid ${C.cream}`,
                color: C.cream,
                padding: '16px 36px',
                textDecoration: 'none',
              }}
            >
              INICIAR SESIÓN
            </Link>
          </div>
        </div>

        {/* Stamp */}
        <div className="landing-stamp" style={{
          position: 'absolute', right: '8%', top: '15%',
          width: 180, height: 180,
          background: C.pink, border: `4px solid ${C.cream}`,
          transform: 'rotate(-6deg)',
          alignItems: 'center', justifyItems: 'center',
          zIndex: 3,
        }}>
          <div style={{
            width: '82%', height: '82%',
            border: `4px solid ${C.cream}`, borderRadius: '50%',
            display: 'grid', alignItems: 'center', justifyItems: 'center',
            textAlign: 'center',
          }}>
            <span style={{ ...disp, fontSize: 22, color: C.cream }}>RESID.<br />2026</span>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="landing-deco" style={{
          position: 'absolute', bottom: -80, left: '12%',
          width: 240, height: 240,
          borderRadius: '50%',
          background: C.yellow, border: `4px solid ${C.greenDark}`,
          zIndex: 1, opacity: 0.65,
        }} />

        {/* Chrome bottom */}
        <div style={{
          position: 'absolute', bottom: 20, left: 'clamp(16px,4vw,40px)', right: 'clamp(16px,4vw,40px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          ...mono, fontSize: 12, letterSpacing: '0.08em', color: C.cream,
        }}>
          <span>Gracias por estar aquí</span>
          <span>05<span style={dot(C.cream)} />05</span>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image
            src="/ape-logo-blanco.png"
            alt="Aurora Pixel Studio"
            width={72}
            height={72}
            style={{ objectFit: 'contain' }}
          />
          <span style={{ ...mono, fontSize: 14, letterSpacing: '0.08em', color: C.cream }}>Próximo Residente</span>
        </div>
        <span style={{ ...mono, fontSize: 12, letterSpacing: '0.06em', color: '#555555' }}>
          HECHO PARA PRÓXIMOS RESIDENTES
        </span>
      </footer>

    </div>
  )
}
