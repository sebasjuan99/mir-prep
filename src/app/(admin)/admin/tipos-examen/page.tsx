'use client'

import { useState, useEffect, useCallback } from 'react'

interface TipoExamen {
  id: string
  nombre: string
  codigo: string
  descripcion: string | null
  activo: boolean
  preguntas: number
  createdAt: string
}

const emptyForm = { nombre: '', codigo: '', descripcion: '' }

export default function TiposExamenAdmin() {
  const [tipos, setTipos] = useState<TipoExamen[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const fetchTipos = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/tipos-examen')
      .then((r) => r.json())
      .then((data) => { setTipos(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTipos() }, [fetchTipos])

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = editingId ? `/api/admin/tipos-examen/${editingId}` : '/api/admin/tipos-examen'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      resetForm()
      fetchTipos()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (t: TipoExamen) => {
    setEditingId(t.id)
    setForm({ nombre: t.nombre, codigo: t.codigo, descripcion: t.descripcion || '' })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleActivo = async (t: TipoExamen) => {
    setBusy(t.id)
    await fetch(`/api/admin/tipos-examen/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !t.activo }),
    })
    setBusy(null)
    fetchTipos()
  }

  const handleDelete = async (t: TipoExamen) => {
    const msg = t.preguntas > 0
      ? `Este tipo tiene ${t.preguntas} pregunta(s) asociada(s). Si lo eliminas, esas preguntas quedarán sin tipo de examen. ¿Continuar?`
      : '¿Eliminar este tipo de examen?'
    if (!confirm(msg)) return
    setBusy(t.id)
    await fetch(`/api/admin/tipos-examen/${t.id}`, { method: 'DELETE' })
    setBusy(null)
    if (editingId === t.id) resetForm()
    fetchTipos()
  }

  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
  const labelClass = 'block text-sm font-semibold mb-1.5'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Tipos de examen</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Universidades y exámenes estandarizados (MIR, ENARM, UNAL…) a los que se pueden asociar las preguntas.</p>
      </div>

      {/* Form crear / editar */}
      <form onSubmit={handleSubmit} className="rounded-xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{editingId ? 'Editar tipo de examen' : 'Nuevo tipo de examen'}</h2>
        {error && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder="Ej: Universidad El Bosque" />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Código corto *</label>
            <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm uppercase" style={inputStyle} placeholder="Ej: BOSQUE" />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Descripción</label>
            <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder="Opcional" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--accent)' }}>
            {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear tipo de examen'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>Cancelar</button>
          )}
        </div>
      </form>

      {/* Tabla */}
      <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Nombre', 'Código', 'Descripción', 'Preguntas', 'Estado', 'Acciones'].map((h, i) => (
                <th key={h} className={`${i === 5 ? 'text-right' : 'text-left'} py-3 px-4 font-semibold ${i === 2 ? 'hidden md:table-cell' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="py-3 px-4"><div className="skeleton h-5 rounded w-20" /></td>)}
              </tr>
            )) : tipos.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>Aún no hay tipos de examen. Crea el primero arriba.</td></tr>
            ) : tipos.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', opacity: t.activo ? 1 : 0.6 }}>
                <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>{t.nombre}</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>{t.codigo}</span></td>
                <td className="py-3 px-4 hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>{t.descripcion || '—'}</td>
                <td className="py-3 px-4 font-mono" style={{ color: 'var(--text-muted)' }}>{t.preguntas}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: t.activo ? 'var(--success-light)' : 'var(--error-light)', color: t.activo ? 'var(--success)' : 'var(--error)' }}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-dark)' }}>Editar</button>
                    <button onClick={() => toggleActivo(t)} disabled={busy === t.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: t.activo ? 'var(--error-light)' : 'var(--success-light)', color: t.activo ? 'var(--error)' : 'var(--success)' }}>
                      {busy === t.id ? '...' : t.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleDelete(t)} disabled={busy === t.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
