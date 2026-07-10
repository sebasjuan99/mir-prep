'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { C, disp, bodyFont, inkBorder } from '@/lib/cm'
import SectionHeader from './SectionHeader'

const FAQS = [
  {
    q: '«No tengo tiempo, trabajo y hago turnos.»',
    a: 'Por eso este método es para ti: no te pide más horas, te pide gastar mejor las que tienes. Un simulacro de 20 preguntas desde el celular rinde más que una hora releyendo.',
  },
  {
    q: '«Ya estudié mucho, ¿esto es estudiar otra vez?»',
    a: 'No. Es activar lo que ya estudiaste. No aprendes de cero: sacas y fijas lo que ya está en tu cabeza, y encuentras el hueco real.',
  },
  {
    q: '«Ya hago muchas preguntas por mi cuenta.»',
    a: 'La diferencia es medir: cada simulacro te dice en qué estás flojo y a qué universidad apuntar.',
  },
  {
    q: '«¿Sirve para el examen de mi universidad?»',
    a: 'Está ordenada por tipo de examen (UNAL, MIR, ENARM, El Bosque, Rosario y más). Te muestra con cuál te va mejor.',
  },
  {
    q: '«¿Y si no me sirve?»',
    a: '7 días gratis para probarlo completo. Si cancelas antes de que terminen, no se te cobra.',
  },
  {
    q: '«¿Cuánto cuesta?»',
    a: '7 días gratis y luego $87.000/mes. Sin permanencia: cancela cuando quieras.',
  },
]

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion()
  return (
    <div style={{ border: inkBorder, background: open ? C.cream : C.cream2 }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          padding: 'clamp(16px, 2vw, 22px) clamp(16px, 2.4vw, 26px)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ ...disp, fontSize: 'clamp(15px, 1.4vw, 20px)', textTransform: 'none', color: C.ink }}>{q}</span>
        <span aria-hidden style={{ ...disp, fontSize: 24, color: C.pink, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ ...bodyFont, fontSize: 'clamp(15px, 1.1vw, 18px)', lineHeight: 1.6, margin: 0, padding: '0 clamp(16px, 2.4vw, 26px) clamp(20px, 2.4vw, 26px)', color: C.ink2 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqV2() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section style={{ background: C.cream, borderBottom: inkBorder, padding: 'clamp(48px, 7vw, 80px) clamp(16px, 4vw, 40px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <SectionHeader num="06" title="Antes de empezar, lo que sueles preguntarte" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map((f, i) => (
            <Item key={f.q} q={f.q} a={f.a} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
          ))}
        </div>
      </div>
    </section>
  )
}
