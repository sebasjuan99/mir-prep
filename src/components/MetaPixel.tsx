import Script from 'next/script'

// ID del píxel de Meta (Facebook). Configurable por entorno
// (NEXT_PUBLIC_META_PIXEL_ID en Vercel) con el píxel de producción como
// valor por defecto. Si se define vacío, el píxel no se carga.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1951076385611708'

/**
 * Carga el píxel de Meta directamente (fbevents.js), sin depender de crear
 * etiquetas a mano en Google Tag Manager. Registra automáticamente el evento
 * PageView en cada carga de página, base para audiencias y remarketing en
 * Meta Ads.
 *
 * Nota: el contenedor GTM-PGPVZRTD queda cargado para usos futuros, pero el
 * píxel se mide AQUÍ (en código) para no depender de la UI de GTM. No añadir
 * también una etiqueta del píxel dentro de GTM o se contarían los eventos
 * dos veces.
 */
export function MetaPixel() {
  if (!PIXEL_ID) return null
  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
    </>
  )
}

/**
 * Respaldo <noscript> del píxel para usuarios con JavaScript deshabilitado.
 * Se monta al inicio del <body>.
 */
export function MetaPixelNoScript() {
  if (!PIXEL_ID) return null
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        alt=""
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  )
}
