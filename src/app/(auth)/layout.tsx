import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// Páginas de acceso (login/registro/recuperación): no son objetivos de
// búsqueda, así que se excluyen del índice (noindex) pero se permite seguir
// sus enlaces. Título único para evitar duplicados con el resto del sitio.
export const metadata: Metadata = {
  title: 'Acceso',
  robots: { index: false, follow: true },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
