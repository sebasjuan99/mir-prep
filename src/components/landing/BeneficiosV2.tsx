import { C, disp, bodyFont, mono, inkBorder } from '@/lib/cm'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const FILAS = [
  { antes: 'Estudiar más horas para «que se te quede».', con: 'Activas lo que ya sabes, respondiendo.' },
  { antes: 'Releer y «sentir» que dominas.', con: 'Compruebas qué dominas de verdad.' },
  { antes: 'Gastar tu poco tiempo en todo.', con: 'Lo inviertes solo en tu hueco real.' },
  { antes: 'Estudiar para todas las universidades.', con: 'Sabes a cuál tienes más chance y apuntas ahí.' },
  { antes: 'Adivinar si estás listo.', con: 'Ves tu % de preparación subir en tiempo real.' },
]

export default function BeneficiosV2() {
  return (
    <section style={{ background: C.cream, borderBottom: inkBorder, padding: 'clamp(48px, 7vw, 80px) clamp(16px, 4vw, 40px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeader num="04" title="Lo que cambia cuando dejas de estudiar para «meter más»" />

        {/* Encabezados de columnas (solo desktop) */}
        <div className="lp-compare-head" style={{ marginBottom: 14 }}>
          <span style={{ ...mono, fontSize: 12, letterSpacing: '0.12em', color: C.ink2 }}>EN VEZ DE…</span>
          <span aria-hidden />
          <span style={{ ...mono, fontSize: 12, letterSpacing: '0.12em', color: C.greenDark }}>CON PRÓXIMO RESIDENTE</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.6vw, 16px)' }}>
          {FILAS.map((f, i) => (
            <Reveal key={f.antes} delay={i * 0.07}>
              <div className="lp-compare-row">
                {/* En vez de… (apagado) */}
                <div style={{ border: inkBorder, background: C.cream2, padding: 'clamp(16px, 2vw, 22px)', display: 'flex', alignItems: 'center' }}>
                  <p style={{ ...bodyFont, fontSize: 'clamp(14px, 1.05vw, 17px)', lineHeight: 1.45, margin: 0, color: C.ink2, textDecoration: 'line-through', textDecorationColor: C.orange, textDecorationThickness: 2 }}>
                    {f.antes}
                  </p>
                </div>
                {/* Flecha conectora */}
                <div aria-hidden className="lp-compare-arrow" style={{ ...disp, color: C.ink }}>→</div>
                {/* Con Próximo Residente (resaltado, AA) */}
                <div style={{ border: inkBorder, background: C.greenDark, padding: 'clamp(16px, 2vw, 22px)', display: 'flex', alignItems: 'center' }}>
                  <p style={{ ...bodyFont, fontSize: 'clamp(15px, 1.1vw, 18px)', lineHeight: 1.45, margin: 0, color: C.cream, fontWeight: 500 }}>
                    {f.con}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Cierre */}
        <Reveal delay={0.1}>
          <p style={{ ...disp, fontSize: 'clamp(1.1rem, 2.4vw, 2rem)', lineHeight: 1.2, margin: 0, marginTop: 'clamp(28px, 4vw, 44px)', textTransform: 'none' }}>
            No estudias más horas. Estudias las que cuentan. <span style={{ color: C.pink }}>Ese es el atajo real.</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
