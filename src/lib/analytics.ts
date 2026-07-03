'use client'

// Tipado mínimo de la API global de Google Analytics 4 (gtag.js), que se
// inicializa en src/components/GoogleAnalytics.tsx, y del píxel de Meta
// (fbq), que se inicializa en src/components/MetaPixel.tsx.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    fbq?: (...args: unknown[]) => void
  }
}

type EventParams = Record<string, string | number | boolean | undefined>

/**
 * Envía un evento personalizado a Google Analytics 4.
 *
 * Es seguro llamarlo en cualquier contexto: si GA4 todavía no cargó (o el
 * usuario bloquea analytics), simplemente no hace nada — nunca lanza errores
 * ni rompe el flujo de la app.
 *
 * Los eventos aparecen en GA4 → Informes → "Tiempo real" (al instante) y en
 * "Eventos" (a las pocas horas). Marca los que te importen como conversiones
 * en GA4 → Administrar → Eventos → "Marcar como evento clave".
 */
export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

/**
 * Envía un evento estándar al píxel de Meta (fbq('track', ...)).
 *
 * Igual que trackEvent, es seguro en cualquier contexto: si el píxel no cargó
 * (o el usuario bloquea el rastreo) no hace nada y nunca rompe el flujo.
 *
 * Usa los nombres de eventos ESTÁNDAR de Meta (CompleteRegistration,
 * InitiateCheckout, Subscribe, Purchase…) para que el Administrador de eventos
 * los reconozca y puedas optimizar campañas y crear públicos con ellos.
 * Verás la actividad en Meta → Administrador de eventos → "Probar eventos".
 */
export function trackMetaEvent(name: string, params: EventParams = {}) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('track', name, params)
}
