'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { C, disp, mono, bodyFont } from '@/lib/cm'

export default function EstadoSuscripcionPage() {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10

    // Mercado Pago añade ?preapproval_id=... a la back_url al volver del checkout.
    // Lo usamos para vincular la suscripción al usuario logueado de forma fiable.
    const preapprovalId = new URLSearchParams(window.location.search).get('preapproval_id')

    async function vincularSiAplica() {
      if (!preapprovalId) return
      try {
        await fetch('/api/suscripcion/confirmar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preapproval_id: preapprovalId }),
        })
      } catch {
        // si falla, el polling de estado seguirá intentando vía webhook
      }
    }

    async function checkStatus() {
      try {
        const res = await fetch('/api/suscripcion/estado')
        const data = await res.json()
        setStatus(data.status)

        if (data.status === 'authorized') {
          setChecking(false)
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 3000)
        } else {
          setChecking(false)
        }
      } catch {
        setChecking(false)
      }
    }

    vincularSiAplica().then(checkStatus)
  }, [])

  const isActive = status === 'authorized'
  const isPending = status === 'pending' && checking

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', paddingTop: 48, textAlign: 'center' }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', color: C.ink, opacity: 0.45, marginBottom: 16 }}>
        SUSCRIPCIÓN
      </div>

      {isPending && (
        <>
          <h1 style={{ ...disp, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: C.ink, margin: '0 0 20px' }}>
            VERIFICANDO PAGO...
          </h1>
          <p style={{ ...bodyFont, fontSize: 15, color: C.ink, opacity: 0.6, lineHeight: 1.6 }}>
            Estamos confirmando tu pago con Mercado Pago. Esto puede tomar unos segundos.
          </p>
        </>
      )}

      {isActive && (
        <>
          <div style={{
            ...disp, fontSize: 'clamp(3rem, 7vw, 5rem)',
            color: C.green, marginBottom: 16,
          }}>
            ACTIVA
          </div>
          <h1 style={{ ...disp, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: C.ink, margin: '0 0 20px' }}>
            SUSCRIPCIÓN CONFIRMADA
          </h1>
          <p style={{ ...bodyFont, fontSize: 15, color: C.ink, opacity: 0.6, lineHeight: 1.6, marginBottom: 32 }}>
            Ya tienes acceso completo a MIR Prep. Prepárate para tu examen de residencia.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              ...disp, fontSize: 16, padding: '16px 40px',
              background: C.ink, color: C.cream,
              border: 'none', cursor: 'pointer',
            }}
          >
            IR AL DASHBOARD
          </button>
        </>
      )}

      {!isPending && !isActive && (
        <>
          <h1 style={{ ...disp, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: C.orange, margin: '0 0 20px' }}>
            PAGO PENDIENTE
          </h1>
          <p style={{ ...bodyFont, fontSize: 15, color: C.ink, opacity: 0.6, lineHeight: 1.6, marginBottom: 32 }}>
            Tu pago aún no se ha confirmado. Si ya pagaste, puede tomar unos minutos en procesarse.
            Si no completaste el pago, puedes intentarlo nuevamente.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/suscripcion')}
              style={{
                ...disp, fontSize: 14, padding: '14px 28px',
                background: C.green, color: C.cream,
                border: 'none', cursor: 'pointer',
              }}
            >
              INTENTAR DE NUEVO
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                ...mono, fontSize: 11, padding: '14px 28px',
                background: 'transparent', color: C.ink,
                border: `3px solid ${C.ink}`, cursor: 'pointer',
              }}
            >
              VERIFICAR ESTADO
            </button>
          </div>
        </>
      )}
    </div>
  )
}
