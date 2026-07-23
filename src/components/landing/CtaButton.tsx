'use client'

import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { C, G, R, S, bodyFont, mono } from '@/lib/cm'
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

  // 'dark' = degradado de marca sobre fondo claro.
  // 'cream' = botón blanco sólido para secciones de fondo oscuro.
  const isDark = variant === 'dark'
  const bg = isDark ? G.brandVivid : '#FFFFFF'
  const fg = isDark ? '#FFFFFF' : C.purpleDeep

  return (
    <div style={{ textAlign: align, ...style }}>
      <Link
        href={CTA_HREF}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-cta="trial"
        style={{
          ...bodyFont,
          fontWeight: 600,
          fontSize: 'clamp(15px, 1.1vw, 18px)',
          display: 'inline-block',
          border: '1px solid transparent',
          borderRadius: R.sm,
          background: bg,
          color: fg,
          padding: '17px 32px',
          textDecoration: 'none',
          transform: hover ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hover ? S.lg : (isDark ? S.brand : S.md),
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
