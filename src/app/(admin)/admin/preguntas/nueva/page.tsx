'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PreguntaForm from '@/components/admin/PreguntaForm'

export default function NuevaPregunta() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      router.push('/admin/preguntas')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold font-[var(--font-display)] mb-6" style={{ color: 'var(--text-primary)' }}>Nueva pregunta</h1>
      {error && <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>{error}</div>}
      <PreguntaForm onSave={handleSave} saving={saving} />
    </div>
  )
}
