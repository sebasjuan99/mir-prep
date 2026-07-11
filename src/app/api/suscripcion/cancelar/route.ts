import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { cancelarSuscripcion, buscarSuscripciones } from '@/lib/mercadopago'

const VIGENTES = new Set(['authorized', 'pending', 'paused'])

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const dbUser = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Reunir los ids de preapproval a cancelar. Si tenemos el guardado, lo usamos;
  // si no (el enlace por back_url pudo fallar durante la prueba), lo buscamos en
  // Mercado Pago por external_reference (= nuestro user id) y por email. Así el
  // botón cancela de verdad aunque nunca se hubiera enlazado el id.
  const ids = new Set<string>()
  try {
    if (dbUser.mpSuscripcionId) {
      ids.add(dbUser.mpSuscripcionId)
    } else {
      const filtros: Array<{ externalReference?: string; payerEmail?: string }> = [
        { externalReference: dbUser.id },
      ]
      if (dbUser.email) filtros.push({ payerEmail: dbUser.email })
      for (const filtro of filtros) {
        const results = await buscarSuscripciones(filtro)
        for (const s of results) {
          if (VIGENTES.has(s.status)) ids.add(s.id)
        }
      }
    }
  } catch (e) {
    console.error('Cancelar: error buscando suscripción en MP:', e)
    return NextResponse.json({ error: 'Error al contactar Mercado Pago' }, { status: 502 })
  }

  if (ids.size === 0) {
    return NextResponse.json(
      { error: 'No encontramos una suscripción activa para cancelar. Si el problema persiste, contáctanos.' },
      { status: 404 }
    )
  }

  // Cancelar TODAS las vigentes y verificar que MP confirme la cancelación.
  const lista = [...ids]
  const resultados = await Promise.allSettled(lista.map((id) => cancelarSuscripcion(id)))
  const confirmada = resultados.some(
    (r) => r.status === 'fulfilled' && r.value?.status === 'cancelled'
  )

  if (!confirmada) {
    console.error('Cancelar: MP no confirmó la cancelación', {
      userId: dbUser.id,
      ids: lista,
      resultados: resultados.map((r) => (r.status === 'fulfilled' ? r.value : String(r.reason))),
    })
    return NextResponse.json(
      { error: 'No pudimos completar la cancelación en Mercado Pago. Inténtalo de nuevo en unos minutos o contáctanos.' },
      { status: 502 }
    )
  }

  // Guardamos el id que sí quedó cancelado (para el webhook y futuras acciones).
  const idxOk = resultados.findIndex(
    (r) => r.status === 'fulfilled' && r.value?.status === 'cancelled'
  )
  const idCancelado = lista[idxOk] ?? dbUser.mpSuscripcionId ?? lista[0]

  // Mantenemos el acceso hasta el fin del periodo pagado: no tocamos
  // suscripcionExpira, solo marcamos el estado como cancelado.
  await prisma.usuario.update({
    where: { id: dbUser.id },
    data: {
      suscripcionStatus: 'cancelled',
      mpSuscripcionId: idCancelado,
    },
  })

  return NextResponse.json({ ok: true })
}
