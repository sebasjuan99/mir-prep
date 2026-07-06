'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Retardo escalonado en segundos (para revelar en cascada). */
  delay?: number
  /** Distancia del desplazamiento vertical inicial en px. */
  y?: number
  className?: string
  style?: HTMLMotionProps<'div'>['style']
}

/**
 * Envoltura de entrada al hacer scroll: fade + slide-up.
 * Si el usuario tiene `prefers-reduced-motion`, no anima (aparece estático).
 * Anima una sola vez (`once: true`) para no distraer del CTA.
 */
export default function Reveal({ children, delay = 0, y = 24, className, style }: RevealProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <div className={className} style={style as React.CSSProperties}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
