import type { Metadata } from 'next'
import { C } from '@/lib/cm'
import NavMinimal from '@/components/landing/NavMinimal'
import HeroV2 from '@/components/landing/HeroV2'
import ProblemaV2 from '@/components/landing/ProblemaV2'
import InsightV2 from '@/components/landing/InsightV2'
import ComoFuncionaV2 from '@/components/landing/ComoFuncionaV2'
import BeneficiosV2 from '@/components/landing/BeneficiosV2'
import Testimonios from '@/components/landing/Testimonios'
import FaqV2 from '@/components/landing/FaqV2'
import CierreV2 from '@/components/landing/CierreV2'
import FooterV2 from '@/components/landing/FooterV2'

// Canonical propio de la home. El resto de metadata (título, descripción,
// Open Graph) se hereda del layout raíz.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

// Datos estructurados (JSON-LD) para que Google entienda qué es el sitio.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Próximo Residente',
  url: 'https://www.proximoresidente.com',
  logo: 'https://www.proximoresidente.com/revive-logo-color.png',
  description:
    'Plataforma de simulacros para el examen de residencia médica (MIR, ENARM y universidades de Colombia) con metodología de retrieval practice y retroalimentación pedagógica.',
}

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "var(--font-ui, 'Roboto', sans-serif)", background: C.cream, color: C.ink }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <NavMinimal />
      <HeroV2 />
      <ProblemaV2 />
      <InsightV2 />
      <ComoFuncionaV2 />
      <BeneficiosV2 />
      <Testimonios />
      <FaqV2 />
      <CierreV2 />
      <FooterV2 />
    </div>
  )
}
