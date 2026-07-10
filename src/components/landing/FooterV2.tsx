import Image from 'next/image'
import { C, mono } from '@/lib/cm'

/** Footer mínimo para la landing de campaña. */
export default function FooterV2() {
  return (
    <footer className="landing-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Image src="/ape-logo-blanco.png" alt="Próximo Residente" width={64} height={64} style={{ objectFit: 'contain' }} />
        <span style={{ ...mono, fontSize: 14, letterSpacing: '0.08em', color: C.cream }}>Próximo Residente</span>
      </div>
      <span style={{ ...mono, fontSize: 12, letterSpacing: '0.06em', color: '#9A9A9A' }}>
        HECHO PARA PRÓXIMOS RESIDENTES
      </span>
    </footer>
  )
}
