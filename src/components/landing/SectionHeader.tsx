import { C, disp, mono } from '@/lib/cm'
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
  const line = onDark ? C.cream : C.ink
  return (
    <Reveal>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
        <span
          style={{
            ...mono,
            fontSize: 13,
            letterSpacing: '0.14em',
            background: onDark ? C.cream : C.ink,
            color: onDark ? C.ink : C.cream,
            padding: '8px 14px',
            flexShrink: 0,
          }}
        >
          {num}
        </span>
        <h2 style={{ ...disp, fontSize: 'clamp(1.6rem, 3.6vw, 3.6rem)', margin: 0, color: color ?? line, textTransform: 'none', lineHeight: 1.05 }}>
          {title}
        </h2>
        <div style={{ flex: 1, minWidth: 16, height: 4, background: line, alignSelf: 'center' }} />
      </div>
    </Reveal>
  )
}
