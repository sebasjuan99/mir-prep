'use client'

import { useEffect, useState } from 'react'
import { C, disp, mono, bodyFont, inkBorder } from '@/lib/cm'

interface Perfil {
  nombre: string | null
  apellido: string | null
  telefono: string | null
  profesion: string | null
  especialidadAplica: string | null
  onboardingCompletado: boolean
}

const campos: { key: keyof Omit<Perfil, 'onboardingCompletado'>; label: string; placeholder: string }[] = [
  { key: 'nombre', label: 'NOMBRE', placeholder: 'Tu nombre' },
  { key: 'apellido', label: 'APELLIDO', placeholder: 'Tu apellido' },
  { key: 'telefono', label: 'TELÉFONO MÓVIL', placeholder: '+57 300 000 0000' },
  { key: 'profesion', label: 'PROFESIÓN', placeholder: 'Ej: Médico general' },
  { key: 'especialidadAplica', label: 'ESPECIALIDAD A LA QUE APLICAS', placeholder: 'Ej: Cardiología' },
]

export default function OnboardingModal() {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', profesion: '', especialidadAplica: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancel = false
    fetch('/api/user/perfil')
      .then((r) => r.json())
      .then((p: Perfil) => {
        if (cancel || !p || p.onboardingCompletado) return
        setForm({
          nombre: p.nombre || '',
          apellido: p.apellido || '',
          telefono: p.telefono || '',
          profesion: p.profesion || '',
          especialidadAplica: p.especialidadAplica || '',
        })
        setShow(true)
      })
      .catch(() => {})
    return () => { cancel = true }
  }, [])

  if (!show) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/user/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, completarOnboarding: true }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'No se pudo guardar')
      }
      setShow(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(26,26,24,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ background: C.cream, border: inkBorder, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ borderBottom: inkBorder, padding: '24px 28px' }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', color: C.ink2, marginBottom: 10 }}>BIENVENIDO</div>
          <h2 style={{ ...disp, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: C.ink, margin: 0 }}>COMPLETA TUS DATOS</h2>
          <p style={{ ...bodyFont, fontSize: 14, color: C.ink2, margin: '10px 0 0', lineHeight: 1.5 }}>
            Necesitamos algunos datos para personalizar tu preparación. Solo se pedirá una vez; podrás editarlos luego en tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {campos.map((c) => (
            <div key={c.key}>
              <label style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: C.ink2, display: 'block', marginBottom: 6 }}>{c.label}</label>
              <input
                type="text"
                value={form[c.key]}
                onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                required
                placeholder={c.placeholder}
                style={{ ...bodyFont, fontSize: 15, width: '100%', padding: '12px 14px', border: inkBorder, background: C.cream, color: C.ink, outline: 'none' }}
              />
            </div>
          ))}

          {error && <div style={{ ...mono, fontSize: 11, color: C.pink }}>{error}</div>}

          <button
            type="submit"
            disabled={saving}
            style={{ ...disp, fontSize: 16, padding: '14px 28px', background: C.green, color: C.cream, border: 'none', cursor: saving ? 'wait' : 'pointer', marginTop: 4 }}
          >
            {saving ? 'GUARDANDO...' : 'GUARDAR Y CONTINUAR'}
          </button>
        </form>
      </div>
    </div>
  )
}
