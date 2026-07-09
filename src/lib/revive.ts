import { useSyncExternalStore } from 'react'

/**
 * Utilidades para detectar cuándo la app corre embebida dentro de Revive.
 *
 * Comparte la misma lógica de detección de origen que usa el handshake SSO
 * (ver `src/components/ReviveSSO.tsx`) para no duplicar criterios.
 */

/** Orígenes autorizados a embeber la app en un iframe (contenedor de Revive). */
export const ALLOWED_PARENT_ORIGINS = [
  'https://revivevirtual.com',
  'https://www.revivevirtual.com',
]

/** Origin del contenedor padre si la app corre embebida, o `null`. */
export function getParentOrigin(): string | null {
  try {
    const ao = window.location.ancestorOrigins
    if (ao && ao.length > 0) return ao[0]
  } catch {
    /* ancestorOrigins no soportado (Firefox) */
  }
  if (document.referrer) {
    try {
      return new URL(document.referrer).origin
    } catch {
      /* referrer inválido */
    }
  }
  return null
}

/**
 * `true` únicamente cuando la app está embebida en un iframe cuyo contenedor
 * es un origin de Revive confirmado. Un usuario externo directo nunca corre
 * dentro de un iframe, por lo que su experiencia no se ve afectada.
 */
export function isReviveEmbed(): boolean {
  if (typeof window === 'undefined') return false
  if (window.self === window.top) return false
  const parent = getParentOrigin()
  return parent != null && ALLOWED_PARENT_ORIGINS.includes(parent)
}

/** Suscripción vacía: el valor no cambia tras el montaje. */
const noopSubscribe = () => () => {}

/**
 * Hook cliente que resuelve `isReviveEmbed()`. En el servidor y durante la
 * hidratación devuelve `false` (se muestra todo), por lo que los usuarios
 * externos no ven ningún salto de maquetación; en el navegador refleja el
 * valor real del embed sin desajuste de hidratación.
 */
export function useReviveEmbed(): boolean {
  return useSyncExternalStore(noopSubscribe, isReviveEmbed, () => false)
}
