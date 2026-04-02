'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ESPECIALIDADES } from '@/lib/constants'

interface Pregunta {
  id: string
  numero_mir: number
  enunciado: string
  especialidad: string
  tema: string
  dificultad: string
  imagen_url: string | null
  video_url: string | null
}

export default function PreguntasAdmin() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPreguntas = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (especialidad) params.set('especialidad', especialidad)
    fetch(`/api/admin/preguntas?${params}`)
      .then((r) => r.json())
      .then((data) => { setPreguntas(data.preguntas || []); setTotalPages(data.totalPages || 1); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, search, especialidad])

  useEffect(() => { fetchPreguntas() }, [fetchPreguntas])

  const handleDelete = async (id: string) => {
    if (!confirm('Estas seguro de eliminar esta pregunta?')) return
    setDeleting(id)
    await fetch(`/api/admin/preguntas/${id}`, { method: 'DELETE' })
    setDeleting(null)
    fetchPreguntas()
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1) }

  const dificultadColors: Record<string, { bg: string; text: string }> = {
    alta: { bg: 'var(--error-light)', text: 'var(--error)' },
    media: { bg: 'var(--accent-light)', text: 'var(--accent-dark)' },
    baja: { bg: 'var(--success-light)', text: 'var(--success)' },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Preguntas</h1>
        <Link href="/admin/preguntas/nueva" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nueva pregunta
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Buscar por enunciado, tema o numero MIR..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        <select value={especialidad} onChange={(e) => { setEspecialidad(e.target.value); setPage(1) }} className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          <option value="">Todas las especialidades</option>
          {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent-dark)' }}>Buscar</button>
      </form>

      <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['#MIR', 'Especialidad', 'Tema', 'Dificultad', 'Media', 'Acciones'].map((h, i) => (
                <th key={h} className={`${i === 5 ? 'text-right' : 'text-left'} py-3 px-4 font-semibold ${i === 2 ? 'hidden md:table-cell' : ''}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="py-3 px-4"><div className="skeleton h-5 rounded w-20" /></td>)}
              </tr>
            )) : preguntas.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>No se encontraron preguntas</td></tr>
            ) : preguntas.map((p) => {
              const dc = dificultadColors[p.dificultad] || dificultadColors.media
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 px-4 font-bold font-mono" style={{ color: 'var(--accent)' }}>{p.numero_mir}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>{p.especialidad}</span></td>
                  <td className="py-3 px-4 hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>{p.tema}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: dc.bg, color: dc.text }}>{p.dificultad}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      {p.imagen_url && <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--accent)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>}
                      {p.video_url && <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--accent)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>}
                      {!p.imagen_url && !p.video_url && <span style={{ color: 'var(--text-muted)' }}>\u2014</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/preguntas/${p.id}/editar`} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-dark)' }}>Editar</Link>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>{deleting === p.id ? '...' : 'Eliminar'}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>Anterior</button>
          <span className="text-sm px-3" style={{ color: 'var(--text-muted)' }}>Pagina {page} de {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>Siguiente</button>
        </div>
      )}
    </div>
  )
}
