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

export const metadata: Metadata = {
  title: 'Próximo Residente — Simulacros de Exámenes de Residencia',
  description: 'Prepárate para tu examen de residencia (MIR, ENARM y universidades de Colombia) con simulacros interactivos, retroalimentación pedagógica y fichas de estudio por tema.',
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
