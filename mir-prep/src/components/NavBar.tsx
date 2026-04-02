'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

interface NavBarProps {
  userEmail: string
}

export default function NavBar({ userEmail }: NavBarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/simulacro', label: 'Simulacro', icon: '📝' },
    { href: '/especialidades', label: 'Especialidades', icon: '🏥' },
  ]

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{ background: 'rgba(250, 250, 247, 0.95)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <span className="font-[var(--font-display)] text-lg font-bold hidden sm:block">
                MIR Prep
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? ''
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    background: pathname.startsWith(link.href) ? 'var(--accent-light)' : 'transparent',
                    color: pathname.startsWith(link.href) ? 'var(--accent-dark)' : 'var(--text-muted)',
                  }}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              {userEmail}
            </span>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 text-sm rounded-lg border transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Salir
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 space-y-1 border-t" style={{ borderColor: 'var(--border)' }}>
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium"
                style={{
                  background: pathname.startsWith(link.href) ? 'var(--accent-light)' : 'transparent',
                  color: pathname.startsWith(link.href) ? 'var(--accent-dark)' : 'var(--text-muted)',
                }}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
