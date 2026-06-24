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

// Cambiar correo y/o contraseña de un usuario. Requiere service-role.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: SERVICE_ROLE_MISSING_MSG }, { status: 503 })

  const { id } = await params
  const body = await request.json()
  const email = typeof body.email === 'string' ? body.email.trim() : undefined
  const password = typeof body.password === 'string' ? body.password : undefined

  if (!email && !password) {
    return NextResponse.json({ error: 'Indica correo y/o contraseña' }, { status: 400 })
  }
  if (password && password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const dbUser = await prisma.usuario.findUnique({ where: { id } })
  if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const attrs: { email?: string; password?: string; email_confirm?: boolean } = {}
  if (email) { attrs.email = email; attrs.email_confirm = true }
  if (password) attrs.password = password

  const { error } = await supabaseAdmin.auth.admin.updateUserById(dbUser.auth_id, attrs)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Sincronizamos el correo en nuestra tabla.
  if (email) {
    await prisma.usuario.update({ where: { id }, data: { email } }).catch(() => null)
  }

  return NextResponse.json({ ok: true })
}
