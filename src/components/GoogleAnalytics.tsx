import Script from 'next/script'

// ID de medición de Google Analytics 4 (formato G-XXXXXXXXXX).
// Configurable por entorno (NEXT_PUBLIC_GA_ID en Vercel) con la propiedad
// de producción como valor por defecto. Si se define vacía, GA4 no se carga.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-R1HREDTG85'

/**
 * Carga Google Analytics 4 directamente (gtag.js), sin necesidad de crear
 * etiquetas a mano en Google Tag Manager. Mide automáticamente páginas
 * vistas, sesiones, usuarios en tiempo real, dispositivos y ubicación
 * (Enhanced Measurement viene activado por defecto en GA4).
 *
 * Nota: GA4 se mide AQUÍ (en código). El contenedor GTM-PGPVZRTD queda
 * cargado para usos futuros (píxel de Meta, eventos, etc.) pero NO debe
 * tener su propia etiqueta de GA4 o se contarían las visitas dos veces.
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null
  return (
    <>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  )
}
