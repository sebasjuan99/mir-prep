'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { C, mono, disp, inkBorder } from '@/lib/cm'

interface NavBarProps {
  userEmail: string
}

const links = [
  { href: '/dashboard',     label: 'DASHBOARD'     },
  { href: '/simulacro',     label: 'SIMULACRO'     },
  { href: '/especialidades', label: 'ESPECIALIDADES' },
]

export default function NavBar({ userEmail }: NavBarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{ background: C.cream, borderBottom: inkBorder, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <Image src="/ape-logo-negro.png" alt="Aurora Pixel Studio" width={28} height={28} style={{ objectFit: 'contain' }} />
              <span style={{ ...mono, fontSize: 13, letterSpacing: '0.1em', color: C.ink }}>MIR PREP</span>
            </Link>

            {/* Desktop nav links */}
            <div style={{ display: 'flex', gap: 0 }} className="hidden md:flex">
              {links.map(link => {
                const active = pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      ...mono,
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      padding: '8px 16px',
                      textDecoration: 'none',
                      background: active ? C.ink : 'transparent',
                      color: active ? C.cream : C.ink2,
                      borderRight: `1px solid ${C.ink2}`,
                    }}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ ...mono, fontSize: 10, letterSpacing: '0.06em', color: C.ink2 }} className="hidden sm:block">
              {userEmail}
            </span>
            <button
              onClick={() => signOut()}
              style={{
                ...mono, fontSize: 11, letterSpacing: '0.08em',
                border: inkBorder,
                background: 'transparent', color: C.ink,
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              SALIR
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', border: inkBorder, padding: '8px 12px', cursor: 'pointer', background: 'transparent', color: C.ink }}
            >
              {menuOpen ? 'CERRAR' : 'MENU'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ borderTop: inkBorder, paddingBottom: 16 }} className="md:hidden">
            {links.map(link => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    ...mono,
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    display: 'block',
                    padding: '14px 0',
                    textDecoration: 'none',
                    borderBottom: `1px solid ${C.ink2}`,
                    color: active ? C.ink : C.ink2,
                    background: 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
