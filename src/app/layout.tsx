import type { Metadata } from 'next'
import { Playfair_Display, Source_Serif_4, DM_Sans, Archivo_Black, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import ReviveSSO from '@/components/ReviveSSO'
import { GoogleTagManagerScript, GoogleTagManagerNoScript } from '@/components/GoogleTagManager'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
})

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-grotesk',
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
    images: [{ url: '/ape-logo-negro.png', width: 512, height: 512, alt: 'Próximo Residente' }],
  },
  twitter: {
    card: 'summary',
    title: 'Próximo Residente — Simulacros para el examen de residencia (MIR, ENARM)',
    description: SITE_DESCRIPTION,
    images: ['/ape-logo-negro.png'],
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
  icons: {
    icon: '/ape-logo-negro.png',
    apple: '/ape-logo-negro.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${sourceSerif.variable} ${dmSans.variable} ${archivoBlack.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <GoogleTagManagerScript />
      <GoogleAnalytics />
      <body className="font-[var(--font-ui)] antialiased min-h-screen">
        <GoogleTagManagerNoScript />
        <ReviveSSO />
        {children}
      </body>
    </html>
  )
}
