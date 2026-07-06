import { C, disp, bodyFont, inkBorder } from '@/lib/cm'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const DOLORES = [
  {
    top: C.orange,
    titulo: '«Estudio todos los días y no logro pasar.»',
    cuerpo:
      'Le metes horas, relees la guía completa, resuelves preguntas… y frente al examen se te olvida. Y concluyes que necesitas estudiar más. Pero llevas meses estudiando más y el resultado no cambia.',
  },
  {
    top: C.yellow,
    titulo: '«No tengo tiempo de estudiar.»',
    cuerpo:
      'Trabajas, haces turnos, llegas muerto. Sientes que necesitarías el doble de horas que no tienes, y esa sensación de ir siempre atrasado te desgasta antes de empezar.',
  },
]

export default function ProblemaV2() {
  return (
    <section style={{ background: C.cream, borderBottom: inkBorder, padding: 'clamp(48px, 7vw, 80px) clamp(16px, 4vw, 40px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeader num="01" title="Estudias más que nadie y aun así, ¿no logras pasar a residencia?" />

        <div className="lp-two">
          {DOLORES.map((d, i) => (
            <Reveal key={d.titulo} delay={i * 0.1}>
              <div style={{ border: inkBorder, background: C.cream2, height: '100%' }}>
                <div style={{ height: 10, background: d.top, borderBottom: inkBorder }} />
                <div style={{ padding: 'clamp(24px, 3vw, 36px)' }}>
                  <h3 style={{ ...disp, fontSize: 'clamp(19px, 2.2vw, 28px)', margin: 0, marginBottom: 16, textTransform: 'none', lineHeight: 1.15 }}>
                    {d.titulo}
                  </h3>
                  <p style={{ ...bodyFont, fontSize: 'clamp(15px, 1.1vw, 18px)', lineHeight: 1.6, margin: 0, color: C.ink2 }}>
                    {d.cuerpo}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Cierre destacado */}
        <Reveal delay={0.15}>
          <div
            style={{
              marginTop: 'clamp(28px, 4vw, 48px)',
              border: inkBorder,
              background: C.ink,
              color: C.cream,
              padding: 'clamp(28px, 4vw, 48px)',
            }}
          >
            <p style={{ ...bodyFont, fontSize: 'clamp(17px, 1.6vw, 26px)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
              Las dos historias tienen la misma raíz: estudias para meter más conocimiento, cuando ya lo tienes. Son años
              de medicina en tu cabeza.{' '}
              <span style={{ color: C.pink }}>
                El problema no es llenar el vaso —ya está lleno—. Es que no logras sacar lo que ya está adentro.
              </span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
