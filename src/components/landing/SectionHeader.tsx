import { C, R, disp, mono } from '@/lib/cm'
import Reveal from './Reveal'

type SectionHeaderProps = {
  num: string
  title: string
  /** Color del título (por defecto tinta). */
  color?: string
  /** Color del texto/regla sobre fondos oscuros. */
  onDark?: boolean
}

/** Encabezado de sección: chip numerado + título display + regla horizontal. */
export default function SectionHeader({ num, title, color, onDark = false }: SectionHeaderProps) {
  const line = onDark ? 'rgba(255,255,255,0.28)' : C.line
  return (
    <Reveal>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
        <span
          style={{
            ...mono,
            fontSize: 13,
            letterSpacing: '0.14em',
            background: onDark ? 'rgba(255,255,255,0.14)' : C.pinkSoft,
            color: onDark ? '#FFFFFF' : '#AF296D',
            padding: '7px 14px',
            borderRadius: R.pill,
            flexShrink: 0,
          }}
        >
          {num}
        </span>
        <h2 style={{ ...disp, fontSize: 'clamp(1.6rem, 3.6vw, 3.2rem)', margin: 0, color: color ?? (onDark ? '#FFFFFF' : C.ink) }}>
          {title}
        </h2>
        <div style={{ flex: 1, minWidth: 16, height: 1, background: line, alignSelf: 'center' }} />
      </div>
    </Reveal>
  )
}
