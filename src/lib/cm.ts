import type { CSSProperties } from 'react'

export const C = {
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

export const disp: CSSProperties = {
  fontFamily: "var(--font-archivo, 'Archivo Black', sans-serif)",
  textTransform: 'uppercase',
  lineHeight: 0.92,
  letterSpacing: '-0.01em',
}

export const mono: CSSProperties = {
  fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
  textTransform: 'uppercase',
}

export const bodyFont: CSSProperties = {
  fontFamily: "var(--font-grotesk, 'Space Grotesk', sans-serif)",
}

export const kicker = (bg: string = C.ink, color: string = C.cream): CSSProperties => ({
  ...mono,
  fontSize: 12,
  letterSpacing: '0.14em',
  background: bg,
  color,
  padding: '6px 12px',
  display: 'inline-block',
})

export const inkBorder = `4px solid ${C.ink}` as const

export const dot = (color: string = C.ink): CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: color,
  margin: '0 8px',
  verticalAlign: 'middle',
})
