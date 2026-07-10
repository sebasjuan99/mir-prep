'use client'

import { useState, type CSSProperties } from 'react'
import { C, disp, mono, inkBorder } from '@/lib/cm'

type VideoSlotProps = {
  id: string
  /** Relación de aspecto CSS, p. ej. '16 / 9', '9 / 16', '1 / 1'. */
  aspectRatio?: string
  /** URL del video. Si está vacío → se renderiza el placeholder. */
  src?: string
  /** ID de YouTube. Si se pasa, se renderiza un embed (facade) en vez de <video>. */
  youtubeId?: string
  poster?: string
  /** Texto de instrucción visible en el placeholder (qué falta subir). */
  placeholder?: string
  /** Pie de video (subtítulo descriptivo) mostrado bajo el video real. */
  caption?: string
  /** Texto para la pista de subtítulos / accesibilidad. */
  label?: string
  /** 'loop' = autoplay muted en bucle · 'player' = con controles, sin autoplay. */
  mode?: 'loop' | 'player'
  /** Pista .vtt de subtítulos (accesibilidad). */
  captionsSrc?: string
  style?: CSSProperties
}

/**
 * Slot de video reutilizable para la landing.
 * - Sin `src`: muestra un placeholder con borde punteado y texto de instrucción
 *   para que el equipo sepa exactamente qué subir (nunca relleno silencioso).
 * - Con `src`: renderiza el video en modo loop (autoplay muted) o player (controles).
 * Lazy por defecto (`preload="none"`) para no bloquear el render del hero.
 */
export default function VideoSlot({
  id,
  aspectRatio = '16 / 9',
  src,
  youtubeId,
  poster,
  placeholder = 'Subir video aquí',
  caption,
  label,
  mode = 'player',
  captionsSrc,
  style,
}: VideoSlotProps) {
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const hasVideo = (Boolean(src) || Boolean(youtubeId)) && !failed

  const frameStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio,
    border: inkBorder,
    background: C.ink,
    overflow: 'hidden',
    ...style,
  }

  // ── Embed de YouTube (facade) ────────────────────────────────────────────
  // Estado inicial: poster propio + botón de play (carga instantánea, sin el
  // iframe pesado de YouTube). Al hacer clic se inserta el iframe con autoplay.
  if (youtubeId) {
    const embedSrc = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    return (
      <figure style={{ margin: 0 }}>
        <div style={frameStyle}>
          {playing ? (
            <iframe
              src={embedSrc}
              title={label ?? placeholder}
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={label ? `Reproducir: ${label}` : 'Reproducir video'}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, background: C.ink, cursor: 'pointer', overflow: 'hidden' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {poster && <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              <span aria-hidden style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                <span style={{ width: 68, height: 68, borderRadius: '50%', background: C.pink, border: `4px solid ${C.ink}`, display: 'grid', placeItems: 'center', ...disp, fontSize: 26, color: C.ink, paddingLeft: 6 }}>▶</span>
              </span>
            </button>
          )}
        </div>
        {caption && (
          <figcaption style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink2, marginTop: 10 }}>
            {caption}
          </figcaption>
        )}
      </figure>
    )
  }

  if (!hasVideo) {
    return (
      <figure style={{ margin: 0 }}>
        <div
          data-video-slot={id}
          style={{
            ...frameStyle,
            border: `4px dashed ${C.ink}`,
            background: C.cream2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <span
            aria-hidden
            style={{
              ...mono,
              fontSize: 11,
              letterSpacing: '0.14em',
              background: C.ink,
              color: C.cream,
              padding: '5px 10px',
            }}
          >
            SLOT VIDEO · {id}
          </span>
          <span style={{ ...mono, fontSize: 13, letterSpacing: '0.04em', color: C.ink2, maxWidth: 280, lineHeight: 1.5 }}>
            {placeholder}
          </span>
        </div>
      </figure>
    )
  }

  const commonProps = {
    poster,
    playsInline: true,
    preload: 'none' as const,
    style: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
    onError: () => setFailed(true),
  }

  return (
    <figure style={{ margin: 0 }}>
      <div style={frameStyle}>
        {mode === 'loop' ? (
          <video {...commonProps} autoPlay muted loop aria-label={label ?? placeholder}>
            <source src={src} />
            {captionsSrc && <track kind="captions" src={captionsSrc} srcLang="es" label="Español" default />}
          </video>
        ) : (
          <video {...commonProps} controls aria-label={label ?? placeholder}>
            <source src={src} />
            {captionsSrc && <track kind="captions" src={captionsSrc} srcLang="es" label="Español" default />}
          </video>
        )}
      </div>
      {caption && (
        <figcaption style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: C.ink2, marginTop: 10 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
