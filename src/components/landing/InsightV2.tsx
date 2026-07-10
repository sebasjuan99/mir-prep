import { C, disp, bodyFont, mono, inkBorder } from '@/lib/cm'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const MICROBLOQUES = [
  {
    etiqueta: 'SI ESTUDIAS MUCHO Y NO PASAS',
    texto:
      'Estudias para agregar, no para recuperar. Cambia el método y el mismo conocimiento empieza a salir cuando lo necesitas.',
  },
  {
    etiqueta: 'SI NO TIENES TIEMPO',
    texto:
      'Dejas de malgastarlo releyendo lo que ya dominas. Lo inviertes solo en el hueco real. Menos horas, pero las que cuentan.',
  },
]

export default function InsightV2() {
  return (
    <section style={{ background: C.cream2, borderBottom: inkBorder, padding: 'clamp(48px, 7vw, 80px) clamp(16px, 4vw, 40px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeader num="02" title="No necesitas saber más. Necesitas recordar lo que ya sabes." />

        <div style={{ maxWidth: 760 }}>
          <Reveal>
            <p style={{ ...bodyFont, fontSize: 'clamp(16px, 1.25vw, 21px)', lineHeight: 1.6, margin: 0, marginBottom: 22, color: C.ink }}>
              Hay un hallazgo de la ciencia del aprendizaje, de los más replicados que existen:{' '}
              <strong>recuperar la información de tu memoria la fija mucho más que volver a leerla.</strong> Esforzarte por
              recordar la respuesta desentierra ese conocimiento y lo hace más fácil de traer la próxima vez.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p style={{ ...bodyFont, fontSize: 'clamp(16px, 1.25vw, 21px)', lineHeight: 1.6, margin: 0, color: C.ink2 }}>
              El conocimiento ya está adentro. Releer no lo saca —solo te da la sensación de que lo sabes—. Responder sí lo
              saca, lo fortalece, y te muestra dónde está el hueco real.
            </p>
          </Reveal>
        </div>

        {/* Micro-bloques */}
        <div className="lp-two" style={{ marginTop: 'clamp(32px, 4vw, 52px)' }}>
          {MICROBLOQUES.map((b, i) => (
            <Reveal key={b.etiqueta} delay={i * 0.1}>
              <div style={{ border: inkBorder, background: C.cream, padding: 'clamp(22px, 2.6vw, 32px)', display: 'flex', gap: 16, height: '100%' }}>
                <div
                  aria-hidden
                  style={{
                    width: 12,
                    flexShrink: 0,
                    background: i === 0 ? C.pink : C.green,
                    alignSelf: 'stretch',
                    border: inkBorder,
                  }}
                />
                <div>
                  <div style={{ ...mono, fontSize: 11, letterSpacing: '0.12em', color: C.ink2, marginBottom: 10 }}>{b.etiqueta}</div>
                  <p style={{ ...bodyFont, fontSize: 'clamp(15px, 1.1vw, 18px)', lineHeight: 1.55, margin: 0, color: C.ink }}>{b.texto}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Frase-ancla */}
        <Reveal delay={0.15} y={32}>
          <div
            style={{
              marginTop: 'clamp(36px, 5vw, 60px)',
              border: inkBorder,
              background: C.greenDark,
              padding: 'clamp(32px, 5vw, 64px) clamp(24px, 4vw, 56px)',
              textAlign: 'center',
            }}
          >
            <p style={{ ...disp, fontSize: 'clamp(1.5rem, 4.4vw, 4rem)', lineHeight: 1.08, margin: 0, color: C.cream, textTransform: 'none' }}>
              Ya sabes más de lo que crees. <span style={{ color: C.yellow }}>Solo te falta activarlo.</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
