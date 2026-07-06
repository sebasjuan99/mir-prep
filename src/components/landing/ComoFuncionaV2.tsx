import { C, disp, bodyFont, inkBorder } from '@/lib/cm'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'
import CtaButton from './CtaButton'
import VideoSlot from './VideoSlot'

// Colores elegidos para cumplir contraste AA (>=4.5:1) del texto de cuerpo:
// verde oscuro+crema 5.8:1 · amarillo+tinta 11.8:1 · rosa+tinta 6.8:1 · naranja+tinta 5.4:1
const PASOS = [
  { num: '01', bg: C.greenDark, color: C.cream, titulo: 'Respondes, no relees.', desc: 'Simulacros de 20 preguntas, aleatorios, que te obligan a sacar el dato —justo como el examen.' },
  { num: '02', bg: C.yellow, color: C.ink, titulo: 'Descubres qué ya dominas y qué no.', desc: 'Métricas en tiempo real por especialidad y tema.' },
  { num: '03', bg: C.pink, color: C.ink, titulo: 'Refuerzas solo el hueco real.', desc: 'La plataforma te devuelve tus errores para gastar el tiempo donde hace falta.' },
  { num: '04', bg: C.orange, color: C.ink, titulo: 'Sabes a qué universidad apuntar.', desc: 'Según tu rendimiento, te muestra con qué examen tienes más chance.' },
]

export default function ComoFuncionaV2() {
  return (
    <section style={{ background: C.cream, borderBottom: inkBorder, padding: 'clamp(48px, 7vw, 80px) clamp(16px, 4vw, 40px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeader num="03" title="Cómo proximoresidente.com activa lo que ya sabes" />

        {/* 4 pasos */}
        <div className="lp-steps">
          {PASOS.map((p, i) => (
            <Reveal key={p.num} delay={i * 0.08}>
              <div style={{ border: inkBorder, background: p.bg, color: p.color, padding: 'clamp(22px, 2.4vw, 30px)', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...disp, fontSize: 'clamp(3rem, 5vw, 5rem)', lineHeight: 0.85, opacity: 0.9 }}>{p.num}</div>
                <div>
                  <h3 style={{ ...disp, fontSize: 'clamp(16px, 1.4vw, 21px)', margin: 0, marginBottom: 10, textTransform: 'none', lineHeight: 1.15 }}>{p.titulo}</h3>
                  <p style={{ ...bodyFont, fontSize: 'clamp(14px, 1vw, 16px)', lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* SLOT VIDEO: DEMO */}
        <Reveal delay={0.1} style={{ marginTop: 'clamp(32px, 4vw, 52px)' }}>
          <VideoSlot
            id="DEMO"
            aspectRatio="16 / 9"
            mode="player"
            placeholder="Subir video demo de la plataforma aquí (simulacro de 20 preguntas + pantalla de métricas por especialidad / ranking de universidades, 20-40s)."
            label="Demo de la plataforma: simulacro y métricas"
            caption="Demo real de producto — simulacro + métricas por especialidad."
          />
        </Reveal>

        {/* CTA intermedio */}
        <Reveal delay={0.1} style={{ marginTop: 'clamp(32px, 4vw, 48px)' }}>
          <CtaButton align="center" />
        </Reveal>
      </div>
    </section>
  )
}
