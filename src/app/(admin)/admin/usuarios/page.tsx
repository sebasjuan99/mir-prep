'use client'

import { useState, useEffect, useCallback } from 'react'

interface Usuario {
  id: string
  auth_id: string
  email: string
  nombre: string | null
  apellido: string | null
  telefono: string | null
  profesion: string | null
  especialidadAplica: string | null
  role: string
  activo: boolean
  suscripcionStatus: string
  suscripcionExpira: string | null
  mesesPagados: number
  accesoManual: boolean
  accesoGratisHasta: string | null
  createdAt: string
  sesiones: number
  respuestas: number
}

function accesoInfo(u: Usuario): { text: string; bg: string; color: string } {
  const now = Date.now()
  if (u.suscripcionStatus === 'authorized') return { text: 'Suscrito', bg: 'var(--success-light)', color: 'var(--success)' }
  if (u.accesoManual) return { text: 'Manual', bg: 'var(--accent-light)', color: 'var(--accent-dark)' }
  if (u.accesoGratisHasta && new Date(u.accesoGratisHasta).getTime() > now) return { text: 'Trial', bg: 'var(--accent-light)', color: 'var(--accent-dark)' }
  if (u.suscripcionStatus === 'cancelled' && u.suscripcionExpira && new Date(u.suscripcionExpira).getTime() > now) return { text: 'Periodo pagado', bg: 'var(--bg-secondary)', color: 'var(--text-muted)' }
  return { text: 'Sin acceso', bg: 'var(--error-light)', color: 'var(--error)' }
}

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-ES') : '—')
const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
const labelCls = 'block text-xs font-semibold mb-1'

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [gestion, setGestion] = useState<Usuario | null>(null)
  const [reparando, setReparando] = useState(false)
  const [reparaMsg, setReparaMsg] = useState('')

  const repararSuscripciones = async () => {
    setReparando(true)
    setReparaMsg('')
    try {
      const res = await fetch('/api/admin/suscripcion/backfill', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error al reparar')
      setReparaMsg(`Listo: ${d.enlazados} de ${d.revisados} suscripciones enlazadas con Mercado Pago.`)
      fetchUsuarios()
    } catch (e) {
      setReparaMsg(e instanceof Error ? e.message : 'Error al reparar')
    } finally {
      setReparando(false)
    }
  }

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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo }),
    })
    setUpdating(null)
    fetchUsuarios()
  }

  const changeRole = async (u: Usuario, role: string) => {
    setUpdating(u.id)
    await fetch(`/api/admin/usuarios/${u.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUpdating(null)
    fetchUsuarios()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold font-[var(--font-display)]" style={{ color: 'var(--text-primary)' }}>Usuarios</h1>
        <div className="flex items-center gap-2">
          <button onClick={repararSuscripciones} disabled={reparando} title="Enlaza con Mercado Pago las suscripciones activas que quedaron sin id, para que el botón de cancelar funcione." className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-dark)', border: '1px solid var(--border)' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {reparando ? 'Reparando...' : 'Reparar suscripciones'}
          </button>
          <button onClick={() => setCreando(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nuevo usuario
          </button>
        </div>
      </div>

      {reparaMsg && (
        <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{reparaMsg}</div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); setPage(1) }} className="flex gap-3">
        <input type="text" placeholder="Buscar por email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl text-sm" style={inputStyle} />
        <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--accent-dark)' }}>Buscar</button>
      </form>

      <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Usuario', 'Rol', 'Acceso', 'Estado', 'Respuestas', 'Registro', 'Acciones'].map((h) => (
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
            ) : usuarios.map((u) => {
              const acc = accesoInfo(u)
              const nombreCompleto = [u.nombre, u.apellido].filter(Boolean).join(' ')
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.activo ? 1 : 0.6 }}>
                  <td className="py-3 px-4">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{nombreCompleto || u.email}</span>
                    {nombreCompleto && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</span>}
                  </td>
                  <td className="py-3 px-4">
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} disabled={updating === u.id} className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: u.role === 'admin' ? 'var(--accent-light)' : 'var(--bg-secondary)', color: u.role === 'admin' ? 'var(--accent-dark)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: acc.bg, color: acc.color }}>{acc.text}</span></td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: u.activo ? 'var(--success-light)' : 'var(--error-light)', color: u.activo ? 'var(--success)' : 'var(--error)' }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono" style={{ color: 'var(--text-muted)' }}>{u.respuestas}</td>
                  <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{fecha(u.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setGestion(u)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-dark)' }}>Gestionar</button>
                      <button onClick={() => toggleActivo(u)} disabled={updating === u.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: u.activo ? 'var(--error-light)' : 'var(--success-light)', color: u.activo ? 'var(--error)' : 'var(--success)' }}>
                        {updating === u.id ? '...' : u.activo ? 'Desactivar' : 'Activar'}
                      </button>
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

      {creando && <CrearUsuarioModal onClose={() => setCreando(false)} onDone={() => { setCreando(false); fetchUsuarios() }} />}
      {gestion && <GestionUsuarioModal usuario={gestion} onClose={() => setGestion(null)} onDone={() => { setGestion(null); fetchUsuarios() }} />}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-lg my-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: 'var(--text-muted)' }}>&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function CrearUsuarioModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ email: '', password: '', nombre: '', apellido: '', telefono: '', profesion: '', especialidadAplica: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al crear') }
      onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setSaving(false) }
  }

  const campos: [keyof typeof form, string][] = [['nombre', 'Nombre'], ['apellido', 'Apellido'], ['telefono', 'Teléfono'], ['profesion', 'Profesión'], ['especialidadAplica', 'Especialidad a la que aplica']]

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>{error}</div>}
        <div>
          <label className={labelCls} style={{ color: 'var(--text-primary)' }}>Correo *</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--text-primary)' }}>Contraseña * (mín. 6)</label>
          <input type="text" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {campos.map(([k, label]) => (
            <div key={k}>
              <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{label}</label>
              <input type="text" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Requiere SUPABASE_SERVICE_ROLE_KEY configurada. Si falta, verás un aviso al guardar.</p>
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--accent)' }}>{saving ? 'Creando...' : 'Crear usuario'}</button>
      </form>
    </Modal>
  )
}

function GestionUsuarioModal({ usuario, onClose, onDone }: { usuario: Usuario; onClose: () => void; onDone: () => void }) {
  const [ficha, setFicha] = useState<Usuario | null>(null)
  const [perfil, setPerfil] = useState({ nombre: '', apellido: '', telefono: '', profesion: '', especialidadAplica: '' })
  const [trialDias, setTrialDias] = useState('30')
  const [cred, setCred] = useState({ email: '', password: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const cargar = useCallback(() => {
    fetch(`/api/admin/usuarios/${usuario.id}`).then((r) => r.json()).then((u) => {
      setFicha(u)
      setPerfil({ nombre: u.nombre || '', apellido: u.apellido || '', telefono: u.telefono || '', profesion: u.profesion || '', especialidadAplica: u.especialidadAplica || '' })
      setCred({ email: u.email || '', password: '' })
    }).catch(() => {})
  }, [usuario.id])
  useEffect(() => { cargar() }, [cargar])

  const patch = async (payload: Record<string, unknown>, okMsg: string) => {
    setBusy(true); setMsg('')
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await res.json()
      setMsg(res.ok ? okMsg : (d.error || 'Error'))
      if (res.ok) cargar()
    } catch { setMsg('Error de conexión') } finally { setBusy(false) }
  }

  const guardarCredenciales = async () => {
    setBusy(true); setMsg('')
    const payload: Record<string, string> = {}
    if (cred.email && cred.email !== ficha?.email) payload.email = cred.email
    if (cred.password) payload.password = cred.password
    if (Object.keys(payload).length === 0) { setMsg('Sin cambios en credenciales'); setBusy(false); return }
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}/credenciales`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await res.json()
      setMsg(res.ok ? 'Credenciales actualizadas' : (d.error || 'Error'))
      if (res.ok) { setCred({ ...cred, password: '' }); cargar() }
    } catch { setMsg('Error de conexión') } finally { setBusy(false) }
  }

  const acc = ficha ? accesoInfo(ficha) : null
  const estadoSusc: Record<string, string> = { authorized: 'Activa', cancelled: 'Cancelada', pending: 'Pendiente', paused: 'Pausada', free: 'Sin plan' }

  return (
    <Modal title={usuario.email} onClose={onClose}>
      {!ficha ? <p style={{ color: 'var(--text-muted)' }}>Cargando…</p> : (
        <div className="space-y-6">
          {msg && <div className="p-2 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{msg}</div>}

          {/* Ficha */}
          <section>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Ficha</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Dato label="Suscripción" valor={estadoSusc[ficha.suscripcionStatus] || ficha.suscripcionStatus} />
              <Dato label="Acceso" valor={acc?.text || '—'} />
              <Dato label="Próxima facturación" valor={fecha(ficha.suscripcionExpira)} />
              <Dato label="Meses pagados" valor={String(ficha.mesesPagados)} />
              <Dato label="Preguntas respondidas" valor={String(ficha.respuestas)} />
              <Dato label="Trial hasta" valor={fecha(ficha.accesoGratisHasta)} />
            </div>
          </section>

          {/* Acceso */}
          <section>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Acceso</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Activación manual (permanente)</span>
              <button disabled={busy} onClick={() => patch({ accesoManual: !ficha.accesoManual }, ficha.accesoManual ? 'Acceso manual quitado' : 'Acceso manual activado')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: ficha.accesoManual ? 'var(--success-light)' : 'var(--bg-secondary)', color: ficha.accesoManual ? 'var(--success)' : 'var(--text-muted)' }}>
                {ficha.accesoManual ? 'Activado' : 'Desactivado'}
              </button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={labelCls} style={{ color: 'var(--text-primary)' }}>Acceso gratis temporal (días)</label>
                <input type="number" min={1} value={trialDias} onChange={(e) => setTrialDias(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <button disabled={busy} onClick={() => patch({ accesoGratisDias: Number(trialDias) }, `Acceso gratis por ${trialDias} días`)} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--accent)' }}>Dar acceso</button>
              {ficha.accesoGratisHasta && <button disabled={busy} onClick={() => patch({ accesoGratisDias: 0 }, 'Trial revocado')} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>Revocar</button>}
            </div>
          </section>

          {/* Perfil */}
          <section>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Perfil</h3>
            <div className="grid grid-cols-2 gap-3">
              {([['nombre', 'Nombre'], ['apellido', 'Apellido'], ['telefono', 'Teléfono'], ['profesion', 'Profesión'], ['especialidadAplica', 'Especialidad a la que aplica']] as [keyof typeof perfil, string][]).map(([k, label]) => (
                <div key={k}>
                  <label className={labelCls} style={{ color: 'var(--text-primary)' }}>{label}</label>
                  <input type="text" value={perfil[k]} onChange={(e) => setPerfil({ ...perfil, [k]: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
              ))}
            </div>
            <button disabled={busy} onClick={() => patch(perfil, 'Perfil guardado')} className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--accent-dark)' }}>Guardar perfil</button>
          </section>

          {/* Credenciales */}
          <section>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Credenciales</h3>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Requiere SUPABASE_SERVICE_ROLE_KEY. Si falta, verás un aviso al guardar.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: 'var(--text-primary)' }}>Correo</label>
                <input type="email" value={cred.email} onChange={(e) => setCred({ ...cred, email: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-primary)' }}>Nueva contraseña</label>
                <input type="text" value={cred.password} onChange={(e) => setCred({ ...cred, password: e.target.value })} placeholder="Dejar vacío para no cambiar" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
            </div>
            <button disabled={busy} onClick={guardarCredenciales} className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--accent-dark)' }}>Actualizar credenciales</button>
          </section>

          <div className="flex justify-end">
            <button onClick={onDone} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Cerrar y refrescar</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{valor}</div>
    </div>
  )
}
