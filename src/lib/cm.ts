import type { CSSProperties } from 'react'

/**
 * Sistema visual — Revive Design System.
 *
 * Los valores salen literales del manual de marca (tokens/colors.css,
 * tokens/typography.css, tokens/effects.css). Morado = primario,
 * magenta = secundario, y el degradado magenta → morado es la firma.
 *
 * Las claves de `C` conservan sus nombres históricos para no romper los
 * componentes que ya las consumen, pero su valor y su papel cambiaron:
 *   pink   → magenta de marca (acento fuerte, texto sobre fondo claro)
 *   orange → morado de marca (antes naranja; mismo papel de acento)
 *   yellow → tinte morado claro (decorativo, fondos suaves)
 * Para fondos que llevan texto oscuro encima usa los tintes `*Soft`,
 * nunca los acentos: los acentos ahora son oscuros.
 */
export const C = {
  // ── Superficies ────────────────────────────────────────────────────
  cream: '#FAFAFB',   // surface-page   (neutral-50)
  cream2: '#F3F1F5',  // surface-sunken (neutral-100)
  card: '#FFFFFF',    // surface-card

  // ── Texto ──────────────────────────────────────────────────────────
  ink: '#1C1B1F',     // text-strong (neutral-900)
  ink2: '#565060',    // text-muted  (neutral-600)

  // ── Marca ──────────────────────────────────────────────────────────
  purple: '#71367F',      // purple-500 — primario
  purpleDeep: '#442C71',  // purple-800
  magenta: '#C9376B',     // magenta-500 — secundario

  // ── Acentos (nombres heredados) ────────────────────────────────────
  pink: '#C9376B',    // magenta-500
  orange: '#663D88',  // purple-600
  yellow: '#E9E0F1',  // purple-100 — tinte claro

  // ── Estado ─────────────────────────────────────────────────────────
  green: '#2F9E6F',     // success-500
  greenDark: '#1F7A55', // success oscurecido: aguanta texto claro encima
  danger: '#D23B4E',    // danger-500
  warning: '#D98A1F',   // warning-500

  // ── Tintes: fondos suaves que llevan texto oscuro encima ───────────
  pinkSoft: '#FCEEF3',    // magenta-50
  purpleSoft: '#F5F1F9',  // purple-50
  greenSoft: '#E7F5EE',   // success-50
  dangerSoft: '#FBE9EB',  // danger-50
  warningSoft: '#FDF3E2', // warning-50

  // ── Bordes ─────────────────────────────────────────────────────────
  line: '#E6E3EA',       // border-subtle  (neutral-200)
  lineStrong: '#CFCAD6', // border-default (neutral-300)
} as const

/** Degradados de firma del manual. */
export const G = {
  brand: 'linear-gradient(90deg, #C9376B 0%, #71367F 55%, #442C71 100%)',
  brandVivid: 'linear-gradient(120deg, #AF296D 0%, #663D88 100%)',
  brandSoft: 'linear-gradient(135deg, #FCEEF3 0%, #F5F1F9 100%)',
  ink: 'linear-gradient(160deg, #2F1F4D 0%, #1C1B1F 100%)',
} as const

/** Radios y sombras (tokens/effects.css). */
export const R = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const

export const S = {
  xs: '0 1px 2px rgba(47,31,77,0.06)',
  sm: '0 2px 6px rgba(47,31,77,0.07)',
  md: '0 8px 24px rgba(47,31,77,0.10)',
  lg: '0 18px 48px rgba(47,31,77,0.14)',
  brand: '0 14px 34px rgba(113,54,127,0.32)',
} as const

// ── Tipografía ───────────────────────────────────────────────────────
// Roboto Condensed = display, Roboto = UI y lectura, Roboto Mono = datos.

export const disp: CSSProperties = {
  fontFamily: "var(--font-display, 'Roboto Condensed', sans-serif)",
  fontWeight: 700,
  lineHeight: 1.04,
  letterSpacing: '-0.015em',
}

export const mono: CSSProperties = {
  fontFamily: "var(--font-mono, 'Roboto Mono', monospace)",
  textTransform: 'uppercase',
}

export const bodyFont: CSSProperties = {
  fontFamily: "var(--font-ui, 'Roboto', sans-serif)",
}

/** Texto largo: mismo tipo que la UI pero con interlineado de lectura. */
export const readFont: CSSProperties = {
  fontFamily: "var(--font-ui, 'Roboto', sans-serif)",
  lineHeight: 1.65,
}

/**
 * Etiqueta corta sobre pastilla. Por defecto usa el tinte magenta, que es
 * como el manual resuelve los "eyebrow".
 */
export const kicker = (bg: string = C.pinkSoft, color: string = '#AF296D'): CSSProperties => ({
  ...mono,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.12em',
  background: bg,
  color,
  padding: '6px 12px',
  borderRadius: R.pill,
  display: 'inline-block',
})

/** El separador de la interfaz. Antes 4px negros; ahora una línea fina. */
export const inkBorder = `1px solid ${C.line}` as const

/** Tarjeta estándar: blanca, esquina suave, sombra tenue teñida de morado. */
export const card: CSSProperties = {
  background: C.card,
  border: inkBorder,
  borderRadius: R.lg,
  boxShadow: S.md,
}

/** Botón primario: degradado de marca. */
export const btnPrimary: CSSProperties = {
  background: G.brandVivid,
  color: '#FFFFFF',
  border: '1px solid transparent',
  borderRadius: R.sm,
  boxShadow: S.brand,
  fontFamily: "var(--font-ui, 'Roboto', sans-serif)",
  fontWeight: 600,
  cursor: 'pointer',
}

export const dot = (color: string = C.ink): CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: color,
  margin: '0 8px',
  verticalAlign: 'middle',
})
