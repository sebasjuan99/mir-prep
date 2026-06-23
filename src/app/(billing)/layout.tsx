import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { C, bodyFont } from '@/lib/cm'

// Auth-only layout for billing/subscription pages. Unlike (protected), it does
// NOT enforce the paywall — otherwise an unpaid user redirected here would be
// redirected again, causing an infinite /suscripcion -> /suscripcion loop.
export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div style={{ ...bodyFont, background: C.cream, color: C.ink, minHeight: '100vh' }}>
      <NavBar userEmail={user.email || ''} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 5vw, 40px)' }}>
        {children}
      </main>
    </div>
  )
}
