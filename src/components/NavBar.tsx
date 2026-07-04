'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { C, mono, inkBorder } from '@/lib/cm'

interface NavBarProps {
  userEmail: string
}

const links = [
  { href: '/dashboard',     label: 'DASHBOARD'     },
  { href: '/simulacro',     label: 'SIMULACRO'     },
  { href: '/especialidades', label: 'ESPECIALIDADES' },
  { href: '/flashcards',    label: '✦ FLASHCARDS IA' },
  { href: '/cuenta',        label: 'MI CUENTA'     },
]

export default function NavBar({ userEmail }: NavBarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{ background: C.cream, borderBottom: inkBorder, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <Image src="/ape-logo-negro.png" alt="Aurora Pixel Studio" width={44} height={44} style={{ objectFit: 'contain' }} />
              <span style={{ ...mono, fontSize: 13, letterSpacing: '0.1em', color: C.ink }}>Próximo Residente</span>
            </Link>

            {/* Desktop nav links */}
            <div style={{ gap: 0 }} className="hidden md:flex">
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
            {/* Desktop: email + salir */}
            <span style={{ ...mono, fontSize: 10, letterSpacing: '0.06em', color: C.ink2 }} className="hidden lg:block">
              {userEmail}
            </span>
            <button
              onClick={() => signOut()}
              className="hidden md:block"
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

            {/* Mobile menu toggle (hamburger) */}
            <button
              className="flex md:hidden"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                border: inkBorder, background: menuOpen ? C.ink : 'transparent',
                color: menuOpen ? C.cream : C.ink,
                width: 44, height: 40, lineHeight: 1, fontSize: 20,
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ borderTop: inkBorder, paddingBottom: 20 }} className="md:hidden">
            {links.map(link => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    ...mono,
                    fontSize: 13,
                    letterSpacing: '0.1em',
                    display: 'block',
                    padding: '16px 4px',
                    textDecoration: 'none',
                    borderBottom: `1px solid ${C.ink2}`,
                    color: active ? C.cream : C.ink2,
                    background: active ? C.ink : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* Email + salir dentro del menú en móvil */}
            <div style={{ ...mono, fontSize: 10, letterSpacing: '0.06em', color: C.ink2, padding: '16px 4px 12px', wordBreak: 'break-all' }}>
              {userEmail}
            </div>
            <button
              onClick={() => { setMenuOpen(false); signOut() }}
              style={{
                ...mono, fontSize: 12, letterSpacing: '0.08em',
                border: inkBorder, background: 'transparent', color: C.ink,
                padding: '14px 0', width: '100%', cursor: 'pointer',
              }}
            >
              SALIR
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
