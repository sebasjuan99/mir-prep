import type { Metadata } from 'next'
import AccesoRevive from './AccesoRevive'

export const metadata: Metadata = {
  title: 'Acceso Revive',
  robots: { index: false, follow: false },
}

export default function AccesoRevivePage() {
  return <AccesoRevive />
}
