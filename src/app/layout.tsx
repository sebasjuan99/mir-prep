import type { Metadata } from 'next'
import { Roboto, Roboto_Condensed, Roboto_Mono } from 'next/font/google'
import './globals.css'
import ReviveSSO from '@/components/ReviveSSO'
import { GoogleTagManagerScript, GoogleTagManagerNoScript } from '@/components/GoogleTagManager'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { MetaPixel, MetaPixelNoScript } from '@/components/MetaPixel'

// Las tres familias del manual de marca de Revive. Roboto Condensed para
// titulares, Roboto para interfaz y lectura, Roboto Mono para datos y
// etiquetas. Sustituyen a las seis familias anteriores: son de la misma
// superfamilia, así que además bajan el peso de fuentes por visita.
const robotoCondensed = Roboto_Condensed({
  weight: ['400', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const SITE_URL = 'https://www.proximoresidente.com'
const SITE_DESCRIPTION =
  'Prepárate para tu examen de residencia (MIR, ENARM y universidades de Colombia) con simulacros interactivos, retroalimentación pedagógica y fichas de estudio por tema.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Próximo Residente — Simulacros para el examen de residencia (MIR, ENARM)',
    template: '%s — Próximo Residente',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'Próximo Residente',
  keywords: [
    'simulacros MIR',
    'examen ENARM',
    'examen de residencia',
    'preguntas MIR',
    'residencia médica',
    'simulacro examen residencia Colombia',
  ],
  authors: [{ name: 'Próximo Residente' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: SITE_URL,
    siteName: 'Próximo Residente',
    title: 'Próximo Residente — Simulacros para el examen de residencia (MIR, ENARM)',
    description: SITE_DESCRIPTION,
    images: [{ url: '/revive-icon-color.png', width: 512, height: 512, alt: 'Próximo Residente' }],
  },
  twitter: {
    card: 'summary',
    title: 'Próximo Residente — Simulacros para el examen de residencia (MIR, ENARM)',
    description: SITE_DESCRIPTION,
    images: ['/revive-icon-color.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // Verificación del dominio en Meta (Facebook) — necesaria para configurar
  // la prioridad de eventos web (AEM) y atribuir conversiones en iOS. Renderiza
  // <meta name="facebook-domain-verification" content="..."> en el <head>.
  verification: {
    other: {
      'facebook-domain-verification': 'e7lmkk0rmaur0eksdrwt203l1jcf7p',
    },
  },
  icons: {
    icon: '/revive-icon-color.png',
    apple: '/revive-icon-color.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${robotoCondensed.variable} ${roboto.variable} ${robotoMono.variable}`}>
      <GoogleTagManagerScript />
      <GoogleAnalytics />
      <MetaPixel />
      <body className="font-[var(--font-ui)] antialiased min-h-screen">
        <GoogleTagManagerNoScript />
        <MetaPixelNoScript />
        <ReviveSSO />
        {children}
      </body>
    </html>
  )
}
