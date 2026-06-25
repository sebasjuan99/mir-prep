import Script from 'next/script'

// ID del contenedor de Google Tag Manager.
// Configurable por entorno (NEXT_PUBLIC_GTM_ID en Vercel) con el contenedor
// de producción como valor por defecto. Si la variable se define vacía, GTM
// no se carga (útil para previews/desarrollo).
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-PGPVZRTD'

/**
 * Script de inicialización de GTM. Equivale al snippet que Google pide poner
 * en el <head>. Usa strategy="afterInteractive" para no bloquear el render
 * inicial; Next lo inyecta en el head automáticamente.
 */
export function GoogleTagManagerScript() {
  if (!GTM_ID) return null
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  )
}

/**
 * Fallback <noscript> de GTM. Equivale al iframe que Google pide poner
 * justo después de abrir el <body>. Solo actúa si el usuario tiene JS
 * deshabilitado.
 */
export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}
