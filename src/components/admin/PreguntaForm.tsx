'use client'

import { useState, useEffect } from 'react'
import { ESPECIALIDADES } from '@/lib/constants'

interface Opcion {
  letra: string
  texto: string
}

interface TipoExamenOption {
  id: string
  nombre: string
  codigo: string
}

interface PreguntaFormProps {
  initialData?: Record<string, unknown>
  onSave: (data: Record<string, unknown>) => void
  saving: boolean
}

const LETRAS = ['A', 'B', 'C', 'D', 'E']

export default function PreguntaForm({ initialData, onSave, saving }: PreguntaFormProps) {
  const initOpciones: Opcion[] = initialData?.opciones
    ? (initialData.opciones as Opcion[])
    : LETRAS.map((l) => ({ letra: l, texto: '' }))

  const [numeroMir, setNumeroMir] = useState(String(initialData?.numero_mir || ''))
  const [enunciado, setEnunciado] = useState((initialData?.enunciado as string) || '')
  const [opciones, setOpciones] = useState<Opcion[]>(initOpciones)
  const [respuestaCorrecta, setRespuestaCorrecta] = useState((initialData?.respuesta_correcta as string) || 'A')
  const [imagenUrl, setImagenUrl] = useState((initialData?.imagen_url as string) || '')
  const [videoUrl, setVideoUrl] = useState((initialData?.video_url as string) || '')
  const [especialidad, setEspecialidad] = useState((initialData?.especialidad as string) || '')
  const [customEspecialidad, setCustomEspecialidad] = useState('')
  const [tema, setTema] = useState((initialData?.tema as string) || '')
  const [subtema, setSubtema] = useState((initialData?.subtema as string) || '')
  const [dificultad, setDificultad] = useState((initialData?.dificultad as string) || 'media')
  const [tipoExamenId, setTipoExamenId] = useState(String(initialData?.tipoExamen_id || ''))
  const [tiposExamen, setTiposExamen] = useState<TipoExamenOption[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetch('/api/admin/tipos-examen?activo=true')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTiposExamen(data) })
      .catch(() => {})
  }, [])

  const updateOpcion = (index: number, texto: string) => {
    const next = [...opciones]
    next[index] = { ...next[index], texto }
    setOpciones(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalEspecialidad = especialidad === '__custom__' ? customEspecialidad : especialidad
    onSave({
      numero_mir: parseInt(numeroMir),
      enunciado,
      opciones,
      respuesta_correcta: respuestaCorrecta,
      imagen_url: imagenUrl || null,
      video_url: videoUrl || null,
      especialidad: finalEspecialidad,
      tema,
      subtema: subtema || null,
      dificultad,
      tipoExamen_id: tipoExamenId || null,
    })
  }

  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
  const labelClass = 'block text-sm font-semibold mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        {/* numero_mir */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Numero MIR *</label>
          <input type="number" value={numeroMir} onChange={(e) => setNumeroMir(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder="Ej: 1234" />
        </div>

        {/* enunciado */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Enunciado *</label>
          <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} required rows={5} className="w-full px-4 py-2.5 rounded-xl text-sm resize-y" style={inputStyle} placeholder="Texto de la pregunta..." />
        </div>

        {/* opciones */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Opciones *</label>
          <div className="space-y-2">
            {opciones.map((op, i) => (
              <div key={op.letra} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: respuestaCorrecta === op.letra ? 'var(--success)' : 'var(--bg-secondary)', color: respuestaCorrecta === op.letra ? 'white' : 'var(--text-primary)' }}>{op.letra}</span>
                <input type="text" value={op.texto} onChange={(e) => updateOpcion(i, e.target.value)} required className="flex-1 px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder={`Opcion ${op.letra}`} />
              </div>
            ))}
          </div>
        </div>

        {/* respuesta correcta */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Respuesta correcta *</label>
          <select value={respuestaCorrecta} onChange={(e) => setRespuestaCorrecta(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm" style={inputStyle}>
            {LETRAS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* media */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>URL de imagen</label>
            <input type="url" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>URL de video</label>
            <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder="https://youtube.com/..." />
          </div>
        </div>

        {/* especialidad, tema, subtema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Especialidad *</label>
            <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle}>
              <option value="">Seleccionar...</option>
              {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
              <option value="__custom__">+ Otra (escribir)</option>
            </select>
            {especialidad === '__custom__' && (
              <input type="text" value={customEspecialidad} onChange={(e) => setCustomEspecialidad(e.target.value)} required className="mt-2 w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder="Nueva especialidad" />
            )}
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Tema *</label>
            <input type="text" value={tema} onChange={(e) => setTema(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder="Ej: Arritmias" />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Subtema</label>
            <input type="text" value={subtema} onChange={(e) => setSubtema(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle} placeholder="Opcional" />
          </div>
        </div>

        {/* dificultad + tipo de examen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Dificultad</label>
            <select value={dificultad} onChange={(e) => setDificultad(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-primary)' }}>Tipo de examen</label>
            <select value={tipoExamenId} onChange={(e) => setTipoExamenId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm" style={inputStyle}>
              <option value="">Sin asignar</option>
              {tiposExamen.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.codigo})</option>)}
            </select>
            {tiposExamen.length === 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No hay tipos de examen activos. Créalos en “Tipos de examen”.</p>
            )}
          </div>
        </div>
      </div>

      {/* Preview toggle */}
      <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-sm font-semibold underline" style={{ color: 'var(--accent)' }}>
        {showPreview ? 'Ocultar preview' : 'Ver preview de FlashCard'}
      </button>

      {showPreview && (
        <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div className="flex flex-wrap gap-2 mb-4">
            {(especialidad && especialidad !== '__custom__' ? especialidad : customEspecialidad) && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>{especialidad === '__custom__' ? customEspecialidad : especialidad}</span>
            )}
            {tema && <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{tema}</span>}
          </div>
          <p className="text-lg leading-relaxed mb-5 font-[var(--font-body)]" style={{ color: 'var(--text-primary)' }}>{enunciado || 'Enunciado de la pregunta...'}</p>
          {imagenUrl && <img src={imagenUrl} alt="Preview" className="mb-4 max-h-48 rounded-lg object-contain" />}
          <div className="space-y-2">
            {opciones.map((op) => (
              <div key={op.letra} className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ border: '2px solid var(--border)', background: respuestaCorrecta === op.letra ? 'var(--success-light)' : 'var(--bg-card)' }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: respuestaCorrecta === op.letra ? 'var(--success)' : 'var(--bg-secondary)', color: respuestaCorrecta === op.letra ? 'white' : 'var(--text-primary)' }}>{op.letra}</span>
                <span className="text-sm pt-0.5">{op.texto || `Opcion ${op.letra}...`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--accent)' }}>
          {saving ? 'Guardando...' : initialData ? 'Actualizar pregunta' : 'Crear pregunta'}
        </button>
        <a href="/admin/preguntas" className="px-6 py-3 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>Cancelar</a>
      </div>
    </form>
  )
}
