'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import PreguntaForm from '@/components/admin/PreguntaForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarPregunta({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [pregunta, setPregunta] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/preguntas/${id}`)
      .then((r) => r.json())
      .then((data) => { setPregunta(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/preguntas/${id}`, {
        method: 'PUT',
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

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    )
  }

  if (!pregunta) return <p style={{ color: 'var(--error)' }}>Pregunta no encontrada</p>

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold font-[var(--font-display)] mb-6" style={{ color: 'var(--text-primary)' }}>
        Editar pregunta #{pregunta.numero_mir as number}
      </h1>
      {error && <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>{error}</div>}
      <PreguntaForm initialData={pregunta} onSave={handleSave} saving={saving} />
    </div>
  )
}
