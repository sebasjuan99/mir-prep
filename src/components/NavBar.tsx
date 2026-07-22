'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { C, R, S, mono, bodyFont, inkBorder } from '@/lib/cm'
import { useReviveEmbed } from '@/lib/revive'

interface NavBarProps {
  userEmail: string
}

const links = [
  { href: '/dashboard',      label: 'Dashboard'      },
  { href: '/simulacro',      label: 'Simulacro'      },
  { href: '/especialidades', label: 'Especialidades' },
  { href: '/flashcards',     label: '✦ Flashcards IA' },
  { href: '/cuenta',         label: 'Mi cuenta'      },
]

export default function NavBar({ userEmail }: NavBarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  // Los usuarios que vienen embebidos desde Revive gestionan su cuenta en Revive,
  // no en nuestra plataforma → les ocultamos "MI CUENTA". Los usuarios directos
  // no corren dentro de un iframe, así que ven el menú completo sin cambios.
  const isReviveEmbed = useReviveEmbed()
  const visibleLinks = isReviveEmbed ? links.filter(l => l.href !== '/cuenta') : links

  return (
    <nav style={{ background: C.card, borderBottom: inkBorder, boxShadow: S.xs, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <Image src="/revive-icon-color.png" alt="Revive" width={44} height={44} style={{ objectFit: 'contain' }} />
              <span style={{ ...bodyFont, fontWeight: 500, fontSize: 15, color: C.ink }}>Próximo Residente</span>
            </Link>

            {/* Desktop nav links */}
            <div style={{ gap: 4 }} className="hidden md:flex">
              {visibleLinks.map(link => {
                const active = pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      ...bodyFont,
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      padding: '8px 14px',
                      borderRadius: R.pill,
                      textDecoration: 'none',
                      background: active ? C.purpleSoft : 'transparent',
                      color: active ? C.purple : C.ink2,
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
                ...bodyFont, fontSize: 13, fontWeight: 500,
                border: inkBorder, borderRadius: R.sm,
                background: 'transparent', color: C.ink2,
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              Salir
            </button>

            {/* Mobile menu toggle (hamburger) */}
            <button
              className="flex md:hidden"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                border: inkBorder, borderRadius: R.sm,
                background: menuOpen ? C.purpleSoft : 'transparent',
                color: menuOpen ? C.purple : C.ink2,
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
            {visibleLinks.map(link => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    ...bodyFont,
                    fontSize: 15,
                    fontWeight: active ? 600 : 400,
                    display: 'block',
                    padding: '15px 14px',
                    marginTop: 4,
                    borderRadius: R.sm,
                    textDecoration: 'none',
                    color: active ? C.purple : C.ink2,
                    background: active ? C.purpleSoft : 'transparent',
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
                ...bodyFont, fontSize: 14, fontWeight: 500,
                border: inkBorder, borderRadius: R.sm,
                background: 'transparent', color: C.ink2,
                padding: '14px 0', width: '100%', cursor: 'pointer',
              }}
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
