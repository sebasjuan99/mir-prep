// ─── Configuración editable de la landing v2 ────────────────────────────────
// Todo el copy y los "slots" de la campaña viven aquí para poder ajustarlos sin
// tocar los componentes. Los [CONFIRMAR] deben resolverse antes de publicar.

/** Destino del CTA único. Reutiliza el flujo de registro / 7 días gratis actual. */
export const CTA_HREF = '/register'
export const LOGIN_HREF = '/login'

/** Texto del CTA repetido en toda la página. */
export const CTA_LABEL = 'Empezar mis 7 días gratis'

/** Microcopy bajo el botón. */
export const CTA_MICROCOPY = '7 días gratis · luego $87.000/mes · cancela cuando quieras'

/** Barra de confianza fina bajo el hero. */
export const TRUST_LINE =
  'Para el examen de UNAL · MIR · ENARM · El Bosque · Rosario y más · Método basado en evidencia'

/**
 * Variante de titular activa para A/B testing según el anuncio.
 * Cambia esta constante ('A' | 'B' | 'C') para alternar el gancho del hero.
 *  A — insight "ya sabes más de lo que crees"
 *  B — dolor "estudio y no paso"
 *  C — dolor "no tengo tiempo"
 */
export const HEADLINE_VARIANT: 'A' | 'B' | 'C' = 'A'

type Headline = {
  /** Fragmentos del titular; los marcados como `accent` se pintan con color de marca. */
  parts: { text: string; accent?: boolean }[]
}

export const HEADLINES: Record<'A' | 'B' | 'C', Headline> = {
  A: {
    parts: [
      { text: 'Pasa a la residencia ' },
      { text: 'activando el conocimiento que ya tienes.', accent: true },
    ],
  },
  B: {
    parts: [
      { text: 'Estudias todo el día y aun así ' },
      { text: 'no pasas.', accent: true },
      { text: ' No es falta de conocimiento: es falta de método para recuperarlo.' },
    ],
  },
  C: {
    parts: [
      { text: 'No tienes tiempo de estudiar más. ' },
      { text: 'No lo necesitas.', accent: true },
      { text: ' Necesitas activar lo que ya sabes.' },
    ],
  },
}

/** Subtítulo del hero (común a las variantes). */
export const HERO_SUBTITLE =
  'La metodología retrieval practice activa lo que años de estudio ya dejaron en tu cabeza, te muestra qué dominas de verdad y en qué enfocar tu poco tiempo. Estudias menos horas, pero las que cuentan.'

// ─── Testimonios ────────────────────────────────────────────────────────────
// Regla dura: NADA de testimonios ni cifras ficticias. Mientras el array esté
// vacío, la sección de testimonios renderiza el estado alterno por evidencia.
export type Testimonial = {
  tipo: 'texto' | 'video'
  nombre: string
  detalle: string
  foto?: string
  quote: string
  estrellas?: number | null
  videoSrc?: string
  poster?: string
}

export const TESTIMONIALS: Testimonial[] = [
  // [INSERTAR TESTIMONIOS REALES] — no rellenar con datos ficticios.
]
