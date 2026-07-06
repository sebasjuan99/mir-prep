import { C, disp, bodyFont, inkBorder } from '@/lib/cm'
import Reveal from './Reveal'
import CtaButton from './CtaButton'

/** Cierre: precio + reversión de riesgo + CTA final. Fondo verde oscuro (AA con crema). */
export default function CierreV2() {
  return (
    <section style={{ background: C.greenDark, borderBottom: inkBorder, padding: 'clamp(56px, 9vw, 110px) clamp(16px, 4vw, 40px)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <h2 style={{ ...disp, fontSize: 'clamp(2rem, 6vw, 4.6rem)', margin: 0, marginBottom: 28, color: C.cream, textTransform: 'none', lineHeight: 1.04 }}>
            Este intento puede ser <span style={{ color: C.yellow }}>distinto.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.06}>
          <p style={{ ...bodyFont, fontSize: 'clamp(16px, 1.4vw, 22px)', lineHeight: 1.6, margin: 0, marginBottom: 20, color: C.cream }}>
            No se trata de estudiar más. Se trata de activar lo que ya sabes, medir dónde estás parado y apuntar tu tiempo
            a lo que de verdad falta.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <p style={{ ...bodyFont, fontSize: 'clamp(16px, 1.4vw, 22px)', lineHeight: 1.6, margin: 0, marginBottom: 40, color: C.cream }}>
            Pruébalo 7 días, gratis. Haz tu primer simulacro hoy y descubre cuánto ya sabías.{' '}
            <strong>Si no sientes la diferencia, no pierdes nada.</strong>
          </p>
        </Reveal>

        <Reveal delay={0.14}>
          <CtaButton showMicrocopy align="center" variant="cream" microcopyColor={C.cream} />
        </Reveal>
      </div>
    </section>
  )
}
