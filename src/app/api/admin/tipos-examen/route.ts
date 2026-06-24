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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const soloActivos = searchParams.get('activo') === 'true'

  const tipos = await prisma.tipoExamen.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { preguntas: true } } },
  })

  return NextResponse.json(
    tipos.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      codigo: t.codigo,
      descripcion: t.descripcion,
      activo: t.activo,
      preguntas: t._count.preguntas,
      createdAt: t.createdAt,
    }))
  )
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const nombre = (body.nombre || '').trim()
  const codigo = (body.codigo || '').trim().toUpperCase()
  const descripcion = (body.descripcion || '').trim() || null

  if (!nombre || !codigo) {
    return NextResponse.json({ error: 'Nombre y código son obligatorios' }, { status: 400 })
  }

  const existing = await prisma.tipoExamen.findUnique({ where: { codigo } })
  if (existing) {
    return NextResponse.json({ error: `Ya existe un tipo de examen con el código "${codigo}"` }, { status: 409 })
  }

  const tipo = await prisma.tipoExamen.create({
    data: { nombre, codigo, descripcion },
  })

  return NextResponse.json(tipo, { status: 201 })
}
