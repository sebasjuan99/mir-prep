import { prisma } from '@/lib/prisma'
import { buscarSuscripciones } from '@/lib/mercadopago'

// Prioridad al elegir entre varias suscripciones del mismo usuario en MP.
// Ignoramos las canceladas (no aparecen aquí → no son candidatas a enlazar).
const PRIORIDAD: Record<string, number> = { authorized: 3, paused: 2, pending: 1 }

/**
 * Rescata y enlaza el `mpSuscripcionId` de un usuario cuando NO lo tenemos
 * guardado. Ocurre cuando el enlace por `back_url` (?preapproval_id) falla
 * durante la prueba gratis: el usuario queda `authorized` pero sin id, y sin
 * id el botón de cancelar no puede llamar a Mercado Pago.
 *
 * Busca en MP por external_reference (= nuestro user id) y por email del
 * pagador, elige la suscripción vigente más relevante, guarda su id (y la
 * fecha de próximo cobro) y lo devuelve. NO toca `suscripcionStatus` para no
 * pisar un estado local (p. ej. 'cancelled'). Devuelve null si no hay ninguna.
 */
export async function enlazarSuscripcionMP(user: {
  id: string
  email: string | null
  mpSuscripcionId: string | null
}): Promise<{ id: string; status: string } | null> {
  if (user.mpSuscripcionId) return { id: user.mpSuscripcionId, status: 'ya-enlazada' }

  const encontrados = new Map<string, { status: string; next?: string }>()

  const filtros: Array<{ externalReference?: string; payerEmail?: string }> = [
    { externalReference: user.id },
  ]
  if (user.email) filtros.push({ payerEmail: user.email })

  for (const filtro of filtros) {
    try {
      const results = await buscarSuscripciones(filtro)
      for (const s of results) {
        encontrados.set(s.id, { status: s.status, next: s.next_payment_date })
      }
    } catch (e) {
      console.error('enlazarSuscripcionMP: búsqueda MP falló', e)
    }
  }

  const candidatos = [...encontrados.entries()]
    .filter(([, v]) => v.status in PRIORIDAD)
    .sort((a, b) => PRIORIDAD[b[1].status] - PRIORIDAD[a[1].status])

  if (candidatos.length === 0) return null

  const [id, info] = candidatos[0]

  await prisma.usuario.update({
    where: { id: user.id },
    data: {
      mpSuscripcionId: id,
      ...(info.next ? { suscripcionExpira: new Date(info.next) } : {}),
    },
  })

  return { id, status: info.status }
}
