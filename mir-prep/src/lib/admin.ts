import { prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }), user: null, dbUser: null }
  }

  const dbUser = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
  })

  if (!dbUser || dbUser.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }), user, dbUser: null }
  }

  if (!dbUser.activo) {
    return { error: NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 }), user, dbUser: null }
  }

  return { error: null, user, dbUser }
}
