import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import OnboardingModal from '@/components/OnboardingModal'
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

  // Paywall: anyone without an active subscription is sent to /suscripcion,
  // which lives in the (billing) group and is NOT wrapped by this layout — so
  // there is no redirect loop.
  const dbUser = await prisma.usuario.findUnique({
    where: { auth_id: user.id },
    select: {
      suscripcionStatus: true,
      suscripcionExpira: true,
      role: true,
      accesoManual: true,
      accesoGratisHasta: true,
    },
  })

  const ahora = new Date()
  const isAdmin = dbUser?.role === 'admin'
  // Acceso si la suscripción está activa, o si fue cancelada pero aún está
  // dentro del periodo ya pagado (suscripcionExpira en el futuro).
  const enPeriodoPagado = !!dbUser?.suscripcionExpira && new Date(dbUser.suscripcionExpira) > ahora
  const isSubscribed = dbUser?.suscripcionStatus === 'authorized'
    || (dbUser?.suscripcionStatus === 'cancelled' && enPeriodoPagado)
  // Activación manual (permanente) o acceso gratis temporal vigente, otorgados por el admin.
  const accesoManual = dbUser?.accesoManual === true
  const trialVigente = !!dbUser?.accesoGratisHasta && new Date(dbUser.accesoGratisHasta) > ahora

  if (!isAdmin && !isSubscribed && !accesoManual && !trialVigente) {
    // Al expirar el trial / sin acceso → al paywall existente.
    redirect('/suscripcion')
  }

  return (
    <div style={{ ...bodyFont, background: C.cream, color: C.ink, minHeight: '100vh' }}>
      <NavBar userEmail={user.email || ''} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 5vw, 40px)' }}>
        {children}
      </main>
      {!isAdmin && <OnboardingModal />}
    </div>
  )
}
