import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
  })
  if (!dbUser || dbUser.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen flex" style={{ background: '#1A1A18' }}>
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  )
}
