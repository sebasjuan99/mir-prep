'use client'

import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { C, disp, mono, inkBorder } from '@/lib/cm'
import { CTA_HREF, CTA_LABEL, CTA_MICROCOPY } from './config'

type CtaButtonProps = {
  /** Muestra el microcopy de precio/prueba bajo el botón. */
  showMicrocopy?: boolean
  /** Tema del botón según el fondo de la sección. */
  variant?: 'dark' | 'cream'
  label?: string
  align?: 'left' | 'center'
  /** Color del microcopy (usa crema sobre fondos oscuros). */
  microcopyColor?: string
  style?: CSSProperties
}

/**
 * CTA único de la campaña. Apunta siempre al flujo de 7 días gratis (CTA_HREF).
 * Micro-interacción: al hover se eleva y aparece una sombra dura (offset).
 */
export default function CtaButton({
  showMicrocopy = false,
  variant = 'dark',
  label = CTA_LABEL,
  align = 'left',
  microcopyColor,
  style,
}: CtaButtonProps) {
  const [hover, setHover] = useState(false)

  const isDark = variant === 'dark'
  const bg = isDark ? C.ink : C.cream
  const fg = isDark ? C.cream : C.ink
  const shadowColor = C.pink

  return (
    <div style={{ textAlign: align, ...style }}>
      <Link
        href={CTA_HREF}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-cta="trial"
        style={{
          ...disp,
          fontSize: 'clamp(15px, 1.1vw, 19px)',
          display: 'inline-block',
          border: inkBorder,
          background: bg,
          color: fg,
          padding: '18px 34px',
          textDecoration: 'none',
          transform: hover ? 'translate(-3px, -3px)' : 'translate(0, 0)',
          boxShadow: hover ? `6px 6px 0 ${shadowColor}, 6px 6px 0 4px ${C.ink}` : '0 0 0 rgba(0,0,0,0)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {label} →
      </Link>
      {showMicrocopy && (
        <p
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: '0.04em',
            color: microcopyColor ?? C.ink2,
            marginTop: 16,
            marginBottom: 0,
            lineHeight: 1.6,
            textTransform: 'none',
          }}
        >
          {CTA_MICROCOPY}
        </p>
      )}
    </div>
  )
}
