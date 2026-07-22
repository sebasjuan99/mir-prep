import Link from 'next/link'
import Image from 'next/image'
import { C, G, R, S, mono, bodyFont, inkBorder } from '@/lib/cm'
import { CTA_HREF, LOGIN_HREF, CTA_LABEL } from './config'

/**
 * Barra superior reducida para la landing de campaña: sin menú de navegación.
 * Solo logo + acceso a la cuenta + el CTA único. Mantiene el foco en un objetivo.
 */
export default function NavMinimal() {
  return (
    <header style={{ borderBottom: inkBorder, background: C.card }}>
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
            src="/revive-icon-color.png"
            alt="Próximo Residente"
            width={44}
            height={44}
            style={{ objectFit: 'contain', flexShrink: 0 }}
            priority
          />
          <span className="hidden sm:inline" style={{ ...bodyFont, fontWeight: 500, fontSize: 15, letterSpacing: '0.01em' }}>
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
              ...bodyFont,
              fontWeight: 600,
              fontSize: 'clamp(11px, 2.6vw, 14px)',
              border: '1px solid transparent',
              borderRadius: R.sm,
              background: G.brandVivid,
              color: '#FFFFFF',
              boxShadow: S.brand,
              padding: '11px clamp(14px, 3vw, 20px)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {CTA_LABEL}
          </Link>
        </div>
      </div>
    </header>
  )
}
