import { C, disp, bodyFont, inkBorder, card } from '@/lib/cm'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'
import CtaButton from './CtaButton'
import VideoSlot from './VideoSlot'

// Tarjetas blancas: el color queda en el número y la franja superior, que
// recorren la escala magenta → morado del manual.
const PASOS = [
  { num: '01', ac: '#C9376B', titulo: 'Respondes, no relees.', desc: 'Simulacros de 20 preguntas, aleatorios, que te obligan a sacar el dato —justo como el examen.' },
  { num: '02', ac: '#AF296D', titulo: 'Descubres qué ya dominas y qué no.', desc: 'Métricas en tiempo real por especialidad y tema.' },
  { num: '03', ac: '#71367F', titulo: 'Refuerzas solo el hueco real.', desc: 'La plataforma te devuelve tus errores para gastar el tiempo donde hace falta.' },
  { num: '04', ac: '#442C71', titulo: 'Sabes a qué universidad apuntar.', desc: 'Según tu rendimiento, te muestra con qué examen tienes más chance.' },
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
              <div style={{ ...card, overflow: 'hidden', color: C.ink, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 4, background: p.ac }} />
                <div style={{ padding: 'clamp(22px, 2.4vw, 30px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ ...disp, fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', lineHeight: 1, color: p.ac }}>{p.num}</div>
                  <div>
                    <h3 style={{ ...disp, fontSize: 'clamp(16px, 1.4vw, 20px)', margin: 0, marginBottom: 10 }}>{p.titulo}</h3>
                    <p style={{ ...bodyFont, fontSize: 'clamp(14px, 1vw, 16px)', lineHeight: 1.6, margin: 0, color: C.ink2 }}>{p.desc}</p>
                  </div>
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
            youtubeId="CNpnobtIZxU"
            poster="/videos/como-funciona.jpg"
            placeholder="Subir video demo de la plataforma aquí (simulacro de 20 preguntas + pantalla de métricas por especialidad / ranking de universidades, 20-40s)."
            label="Cómo funciona proximoresidente.com: recorrido por la plataforma"
            caption="Recorrido por la plataforma — cómo funciona proximoresidente.com."
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
