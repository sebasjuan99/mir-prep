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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (typeof body.nombre === 'string') data.nombre = body.nombre.trim()
  if (typeof body.descripcion === 'string') data.descripcion = body.descripcion.trim() || null
  if (typeof body.activo === 'boolean') data.activo = body.activo
  if (typeof body.codigo === 'string') {
    const codigo = body.codigo.trim().toUpperCase()
    if (!codigo) return NextResponse.json({ error: 'El código no puede estar vacío' }, { status: 400 })
    const existing = await prisma.tipoExamen.findUnique({ where: { codigo } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Ya existe un tipo de examen con el código "${codigo}"` }, { status: 409 })
    }
    data.codigo = codigo
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const tipo = await prisma.tipoExamen.update({ where: { id }, data })
  return NextResponse.json(tipo)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  // Al borrar, las preguntas asociadas quedan con tipoExamen_id = null (onDelete: SetNull)
  await prisma.tipoExamen.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
