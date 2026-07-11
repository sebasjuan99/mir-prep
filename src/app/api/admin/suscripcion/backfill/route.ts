import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { enlazarSuscripcionMP } from '@/lib/suscripcion-link'

// Backfill puntual: enlaza el mpSuscripcionId de los usuarios que están con
// suscripción vigente pero sin id guardado (el enlace por back_url falló
// durante la prueba). Solo admin. Se dispara a mano cuando haga falta.
export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  const pendientes = await prisma.usuario.findMany({
    where: {
      mpSuscripcionId: null,
      suscripcionStatus: { in: ['authorized', 'paused', 'pending'] },
      suscripcionOrigen: 'mercadopago',
    },
    select: { id: true, email: true, mpSuscripcionId: true },
  })

  const resultados: Array<{ email: string | null; enlazada: boolean; id?: string; status?: string }> = []

  for (const u of pendientes) {
    try {
      const enlazada = await enlazarSuscripcionMP(u)
      resultados.push({
        email: u.email,
        enlazada: !!enlazada,
        id: enlazada?.id,
        status: enlazada?.status,
      })
    } catch (e) {
      console.error('backfill: fallo enlazando', u.email, e)
      resultados.push({ email: u.email, enlazada: false })
    }
  }

  return NextResponse.json({
    revisados: pendientes.length,
    enlazados: resultados.filter((r) => r.enlazada).length,
    resultados,
  })
}
