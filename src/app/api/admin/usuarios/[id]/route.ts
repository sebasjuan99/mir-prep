import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.usuario.findUnique({ where: { auth_id: user.id } })
  if (!dbUser || dbUser.role !== 'admin') return null
  return dbUser
}

// Ficha + datos de un usuario para el panel de gestión.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const u = await prisma.usuario.findUnique({ where: { id } })
  if (!u) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const respuestas = await prisma.respuesta.count({ where: { user_id: u.auth_id } })
  const sesiones = await prisma.sesion.count({ where: { user_id: u.auth_id } })

  return NextResponse.json({ ...u, respuestas, sesiones })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}

  // Estado / rol
  if (typeof body.activo === 'boolean') data.activo = body.activo
  if (body.role && ['admin', 'user'].includes(body.role)) data.role = body.role

  // Perfil
  for (const campo of ['nombre', 'apellido', 'telefono', 'profesion', 'especialidadAplica'] as const) {
    if (typeof body[campo] === 'string') data[campo] = body[campo].trim() || null
  }

  // Acceso manual permanente
  if (typeof body.accesoManual === 'boolean') data.accesoManual = body.accesoManual

  // Acceso gratis temporal: se envía `accesoGratisDias` (número) para conceder, o
  // null/0 para revocar. Calculamos la fecha de expiración aquí.
  if ('accesoGratisDias' in body) {
    const dias = Number(body.accesoGratisDias)
    if (!dias || dias <= 0) {
      data.accesoGratisHasta = null
    } else {
      const hasta = new Date()
      hasta.setDate(hasta.getDate() + Math.floor(dias))
      data.accesoGratisHasta = hasta
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const usuario = await prisma.usuario.update({ where: { id }, data })
  return NextResponse.json(usuario)
}
