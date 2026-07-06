import Link from 'next/link'
import Image from 'next/image'
import { C, mono, inkBorder } from '@/lib/cm'
import { CTA_HREF, LOGIN_HREF, CTA_LABEL } from './config'

/**
 * Barra superior reducida para la landing de campaña: sin menú de navegación.
 * Solo logo + acceso a la cuenta + el CTA único. Mantiene el foco en un objetivo.
 */
export default function NavMinimal() {
  return (
    <header style={{ borderBottom: inkBorder, background: C.cream }}>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '14px clamp(16px, 4vw, 40px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Image
            src="/ape-logo-negro.png"
            alt="Próximo Residente"
            width={44}
            height={44}
            style={{ objectFit: 'contain', flexShrink: 0 }}
            priority
          />
          <span className="hidden sm:inline" style={{ ...mono, fontSize: 14, letterSpacing: '0.1em' }}>
            Próximo Residente
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <Link
            href={LOGIN_HREF}
            style={{
              ...mono,
              fontSize: 'clamp(10px, 2.6vw, 12px)',
              letterSpacing: '0.06em',
              padding: '10px clamp(8px, 3vw, 16px)',
              color: C.ink2,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            INICIAR SESIÓN
          </Link>
          <Link
            href={CTA_HREF}
            data-cta="trial"
            style={{
              ...mono,
              fontSize: 'clamp(10px, 2.6vw, 12px)',
              letterSpacing: '0.06em',
              border: inkBorder,
              background: C.ink,
              color: C.cream,
              padding: '10px clamp(12px, 3vw, 18px)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {CTA_LABEL.toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  )
}
