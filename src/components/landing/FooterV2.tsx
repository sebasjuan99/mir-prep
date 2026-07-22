import Image from 'next/image'
import { mono, bodyFont } from '@/lib/cm'

/** Footer mínimo para la landing de campaña. */
export default function FooterV2() {
  return (
    <footer className="landing-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Image src="/revive-icon-blanco.png" alt="Próximo Residente" width={64} height={64} style={{ objectFit: 'contain' }} />
        <span style={{ ...bodyFont, fontWeight: 500, fontSize: 15, color: '#FFFFFF' }}>Próximo Residente</span>
      </div>
      <span style={{ ...mono, fontSize: 12, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>
        HECHO PARA PRÓXIMOS RESIDENTES
      </span>
    </footer>
  )
}
