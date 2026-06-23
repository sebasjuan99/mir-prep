'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { C, disp, mono, bodyFont, kicker, inkBorder } from '@/lib/cm'

type Estado = { status: string; expira: string | null }

const LABELS: Record<string, { texto: string; color: string }> = {
  authorized: { texto: 'ACTIVA', color: C.green },
  cancelled: { texto: 'CANCELADA', color: C.orange },
  pending: { texto: 'PENDIENTE', color: C.orange },
  free: { texto: 'SIN PLAN', color: C.ink2 },
}

function formatFecha(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return '—'
  }
}

export default function CuentaPage() {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/suscripcion/estado')
      const data = await res.json()
      setEstado({ status: data.status, expira: data.expira ?? null })
    } catch {
      setError('No se pudo cargar el estado')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function handleCancelar() {
    setCancelando(true)
    setError('')
    try {
      const res = await fetch('/api/suscripcion/cancelar', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al cancelar')
        setCancelando(false)
        return
      }
      setConfirmar(false)
      await cargar()
    } catch {
      setError('Error de conexión')
    } finally {
      setCancelando(false)
    }
  }

  const info = estado ? (LABELS[estado.status] || { texto: estado.status.toUpperCase(), color: C.ink2 }) : null
  const activa = estado?.status === 'authorized'
  const cancelada = estado?.status === 'cancelled'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ borderBottom: inkBorder, paddingBottom: 32, marginBottom: 40 }}>
        <div style={{ ...kicker(), marginBottom: 16 }}>MI CUENTA</div>
        <h1 style={{ ...disp, fontSize: 'clamp(2rem, 4vw, 3.5rem)', margin: 0 }}>MI SUSCRIPCIÓN</h1>
      </div>

      {loading ? (
        <div style={{ ...mono, fontSize: 12, color: C.ink2 }}>CARGANDO...</div>
      ) : (
        <div style={{ border: inkBorder }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: inkBorder }}>
            <span style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', color: C.ink2 }}>ESTADO DEL PLAN</span>
            <span style={{ ...disp, fontSize: 20, color: info?.color }}>{info?.texto}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: inkBorder }}>
            <span style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', color: C.ink2 }}>PLAN</span>
            <span style={{ ...bodyFont, fontSize: 15, color: C.ink }}>Mensual — $87.000 COP</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px' }}>
            <span style={{ ...mono, fontSize: 11, letterSpacing: '0.1em', color: C.ink2 }}>
              {cancelada ? 'ACCESO HASTA' : 'PRÓXIMO COBRO'}
            </span>
            <span style={{ ...bodyFont, fontSize: 15, color: C.ink }}>{formatFecha(estado?.expira ?? null)}</span>
          </div>

          <div style={{ padding: '24px 28px', borderTop: inkBorder, background: C.cream2 }}>
            {activa && !confirmar && (
              <button
                onClick={() => setConfirmar(true)}
                style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', padding: '14px 24px', border: `3px solid ${C.orange}`, background: 'transparent', color: C.orange, cursor: 'pointer', width: '100%' }}
              >
                CANCELAR SUSCRIPCIÓN
              </button>
            )}

            {activa && confirmar && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ ...bodyFont, fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
                  ¿Seguro que quieres cancelar? Conservarás el acceso hasta el <b>{formatFecha(estado?.expira ?? null)}</b> y no se te volverá a cobrar.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleCancelar}
                    disabled={cancelando}
                    style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', padding: '14px 24px', border: 'none', background: C.orange, color: C.cream, cursor: cancelando ? 'wait' : 'pointer' }}
                  >
                    {cancelando ? 'CANCELANDO...' : 'SÍ, CANCELAR'}
                  </button>
                  <button
                    onClick={() => setConfirmar(false)}
                    disabled={cancelando}
                    style={{ ...mono, fontSize: 12, letterSpacing: '0.08em', padding: '14px 24px', border: inkBorder, background: 'transparent', color: C.ink, cursor: 'pointer' }}
                  >
                    NO, MANTENER
                  </button>
                </div>
              </div>
            )}

            {cancelada && (
              <>
                <p style={{ ...bodyFont, fontSize: 14, color: C.ink, opacity: 0.7, lineHeight: 1.6, margin: '0 0 16px' }}>
                  Tu suscripción está cancelada. Conservas el acceso hasta la fecha indicada. Puedes reactivarla cuando quieras.
                </p>
                <button
                  onClick={() => router.push('/suscripcion')}
                  style={{ ...disp, fontSize: 16, padding: '14px 28px', background: C.green, color: C.cream, border: 'none', cursor: 'pointer', width: '100%' }}
                >
                  REACTIVAR SUSCRIPCIÓN
                </button>
              </>
            )}

            {!activa && !cancelada && (
              <button
                onClick={() => router.push('/suscripcion')}
                style={{ ...disp, fontSize: 16, padding: '14px 28px', background: C.green, color: C.cream, border: 'none', cursor: 'pointer', width: '100%' }}
              >
                VER PLANES
              </button>
            )}

            {error && (
              <div style={{ ...mono, fontSize: 11, color: C.orange, marginTop: 12 }}>{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
