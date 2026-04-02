'use client'

import { useState, useEffect, useCallback } from 'react'
import { ESPECIALIDADES } from '@/lib/constants'

interface Pregunta {
  id: string
  numero_mir: number
  enunciado: string
  especialidad: string
  tema: string
}

interface Simulacro {
  id: string
  filtro: string | null
  total: number
  createdAt: string
}

export default function SimulacrosAdmin() {
  const [simulacros, setSimulacros] = useState<Simulacro[]>([])
  const [loadingSim, setLoadingSim] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Question search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEsp, setFilterEsp] = useState('')
  const [searchResults, setSearchResults] = useState<Pregunta[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Pregunta[]>([])

  const fetchSimulacros = useCallback(() => {
    setLoadingSim(true)
    fetch('/api/admin/simulacros')
      .then((r) => r.json())
      .then((data) => { setSimulacros(data.simulacros || []); setLoadingSim(false) })
      .catch(() => setLoadingSim(false))
  }, [])

  useEffect(() => { fetchSimulacros() }, [fetchSimulacros])

  const searchPreguntas = async () => {
    setSearching(true)
    const params = new URLSearchParams({ limit: '50' })
    if (searchQuery) params.set('search', searchQuery)
    if (filterEsp) params.set('especialidad', filterEsp)
    try {
      const res = await fetch(`/api/admin/preguntas?${params}`)
      const data = await res.json()
      setSearchResults(data.preguntas || [])
    } catch { /* ignore */ }
    setSearching(false)
  }

  const toggleSelect = (p: Pregunta) => {
    setSelected((prev) => prev.some((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || selected.length === 0) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/simulacros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, pregunta_ids: selected.map((s) => s.id) }),
      })
      if (!res.ok) throw new Error('Error al crear')
      setNombre('')
      setSelected([])
      setShowForm(false)
      fetchSimulacros()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const parseFiltro = (filtro: string | null) => {
    if (!filtro) return { nombre: 'Sin nombre', pregunta_ids: [] }
    try { return JSON.parse(filtro) } catch { return { nombre: filtro, pregunta_ids: [] } }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Simulacros personalizados</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>
          {showForm ? 'Cancelar' : 'Crear simulacro'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          {error && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>{error}</div>}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Nombre del simulacro *</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} placeholder="Ej: Simulacro Cardiologia Avanzado" />
          </div>

          {/* Search for questions */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Buscar preguntas</label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} placeholder="Buscar..." />
              <select value={filterEsp} onChange={(e) => setFilterEsp(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="">Todas</option>
                {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <button type="button" onClick={searchPreguntas} disabled={searching} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent-dark)' }}>
                {searching ? '...' : 'Buscar'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
                {searchResults.map((p) => {
                  const isSelected = selected.some((s) => s.id === p.id)
                  return (
                    <button type="button" key={p.id} onClick={() => toggleSelect(p)} className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors" style={{ borderBottom: '1px solid var(--border)', background: isSelected ? 'var(--accent-light)' : 'transparent' }}>
                      <span className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0" style={{ borderColor: isSelected ? 'var(--accent)' : 'var(--border)', background: isSelected ? 'var(--accent)' : 'transparent', color: 'white' }}>
                        {isSelected && '\u2713'}
                      </span>
                      <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>#{p.numero_mir}</span>
                      <span className="flex-1 truncate">{p.enunciado.slice(0, 80)}...</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{p.especialidad}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected questions */}
          {selected.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Preguntas seleccionadas ({selected.length})</p>
              <div className="flex flex-wrap gap-2">
                {selected.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
                    #{p.numero_mir}
                    <button type="button" onClick={() => toggleSelect(p)} className="ml-1 hover:opacity-70">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={saving || selected.length === 0} className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--accent)' }}>
            {saving ? 'Guardando...' : `Crear simulacro (${selected.length} preguntas)`}
          </button>
        </form>
      )}

      {/* Existing simulacros */}
      <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Nombre', 'Preguntas', 'Fecha de creacion'].map((h) => (
                <th key={h} className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingSim ? Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {[1,2,3].map((j) => <td key={j} className="py-3 px-4"><div className="skeleton h-5 rounded w-28" /></td>)}
              </tr>
            )) : simulacros.length === 0 ? (
              <tr><td colSpan={3} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>No hay simulacros personalizados</td></tr>
            ) : simulacros.map((s) => {
              const info = parseFiltro(s.filtro)
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 px-4 font-medium">{info.nombre}</td>
                  <td className="py-3 px-4 font-mono">{s.total}</td>
                  <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString('es-ES')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
