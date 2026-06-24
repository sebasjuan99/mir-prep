import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin, SERVICE_ROLE_MISSING_MSG } from '@/lib/supabase/admin'

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
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.email = { contains: search, mode: 'insensitive' }
  }

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.usuario.count({ where }),
  ])

  // Get session/answer counts for each user
  const userIds = usuarios.map((u) => u.auth_id)
  const sessionCounts = await prisma.sesion.groupBy({
    by: ['user_id'],
    where: { user_id: { in: userIds } },
    _count: true,
  })
  const answerCounts = await prisma.respuesta.groupBy({
    by: ['user_id'],
    where: { user_id: { in: userIds } },
    _count: true,
  })

  const sessionMap = Object.fromEntries(sessionCounts.map((s) => [s.user_id, s._count]))
  const answerMap = Object.fromEntries(answerCounts.map((a) => [a.user_id, a._count]))

  const enriched = usuarios.map((u) => ({
    ...u,
    sesiones: sessionMap[u.auth_id] || 0,
    respuestas: answerMap[u.auth_id] || 0,
  }))

  return NextResponse.json({
    usuarios: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

// Crear usuario manualmente. Requiere service-role (crea el usuario de auth).
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: SERVICE_ROLE_MISSING_MSG }, { status: 503 })

  const body = await request.json()
  const email = (body.email || '').trim()
  const password = body.password || ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña son obligatorios' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  // Crea el usuario de auth ya confirmado (sin enviar email de verificación).
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'No se pudo crear el usuario' }, { status: 400 })
  }

  const usuario = await prisma.usuario.create({
    data: {
      auth_id: data.user.id,
      email,
      role: body.role === 'admin' ? 'admin' : 'user',
      nombre: (body.nombre || '').trim() || null,
      apellido: (body.apellido || '').trim() || null,
      telefono: (body.telefono || '').trim() || null,
      profesion: (body.profesion || '').trim() || null,
      especialidadAplica: (body.especialidadAplica || '').trim() || null,
    },
  })

  return NextResponse.json(usuario, { status: 201 })
}
