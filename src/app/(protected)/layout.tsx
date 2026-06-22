import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import NavBar from '@/components/NavBar'
import { prisma } from '@/lib/prisma'
import { C, bodyFont } from '@/lib/cm'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isSuscripcionPage = pathname.startsWith('/suscripcion')

  if (!isSuscripcionPage) {
    const dbUser = await prisma.usuario.findUnique({
      where: { auth_id: user.id },
      select: { suscripcionStatus: true, role: true },
    })

    const isAdmin = dbUser?.role === 'admin'
    const isSubscribed = dbUser?.suscripcionStatus === 'authorized'

    if (!isAdmin && !isSubscribed) {
      redirect('/suscripcion')
    }
  }

  return (
    <div style={{ ...bodyFont, background: C.cream, color: C.ink, minHeight: '100vh' }}>
      <NavBar userEmail={user.email || ''} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 5vw, 40px)' }}>
        {children}
      </main>
    </div>
  )
}
