'use client'

import { useState, useEffect, useCallback } from 'react'

interface Usuario {
  id: string
  auth_id: string
  email: string
  nombre: string | null
  role: string
  activo: boolean
  createdAt: string
  sesiones: number
  respuestas: number
}

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchUsuarios = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    fetch(`/api/admin/usuarios?${params}`)
      .then((r) => r.json())
      .then((data) => { setUsuarios(data.usuarios || []); setTotalPages(data.totalPages || 1); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  const toggleActivo = async (u: Usuario) => {
    setUpdating(u.id)
    await fetch(`/api/admin/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo }),
    })
    setUpdating(null)
    fetchUsuarios()
  }

  const changeRole = async (u: Usuario, role: string) => {
    setUpdating(u.id)
    await fetch(`/api/admin/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUpdating(null)
    fetchUsuarios()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Usuarios</h1>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1) }} className="flex gap-3">
        <input type="text" placeholder="Buscar por email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent-dark)' }}>Buscar</button>
      </form>

      <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Email', 'Rol', 'Estado', 'Sesiones', 'Respuestas', 'Registro', 'Acciones'].map((h) => (
                <th key={h} className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {Array.from({ length: 7 }).map((_, j) => <td key={j} className="py-3 px-4"><div className="skeleton h-5 rounded w-20" /></td>)}
              </tr>
            )) : usuarios.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>No se encontraron usuarios</td></tr>
            ) : usuarios.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.activo ? 1 : 0.6 }}>
                <td className="py-3 px-4 font-medium">{u.email}</td>
                <td className="py-3 px-4">
                  <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} disabled={updating === u.id} className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: u.role === 'admin' ? 'var(--accent-light)' : 'var(--bg-secondary)', color: u.role === 'admin' ? 'var(--accent-dark)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: u.activo ? 'var(--success-light)' : 'var(--error-light)', color: u.activo ? 'var(--success)' : 'var(--error)' }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">{u.sesiones}</td>
                <td className="py-3 px-4 font-mono">{u.respuestas}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('es-ES')}</td>
                <td className="py-3 px-4">
                  <button onClick={() => toggleActivo(u)} disabled={updating === u.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: u.activo ? 'var(--error-light)' : 'var(--success-light)', color: u.activo ? 'var(--error)' : 'var(--success)' }}>
                    {updating === u.id ? '...' : u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
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
