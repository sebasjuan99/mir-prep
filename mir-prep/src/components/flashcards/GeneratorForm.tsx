'use client'

import { useState, useRef } from 'react'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'
import { AiFlashcard } from '@/components/flashcards/AiFlipCard'

const EXAM_OPTIONS = ['MIR', 'ENARM', 'U.Rosario', 'U.Bosque', 'USMLE']
const COUNT_OPTIONS = [10, 20, 30]

interface GeneratorFormProps {
  keyConfigured: boolean
  onOpenKeyModal: () => void
  onGenerated: (cards: AiFlashcard[], tipoExamen: string) => void
}

export default function GeneratorForm({ keyConfigured, onOpenKeyModal, onGenerated }: GeneratorFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [count, setCount] = useState(10)
  const [tipoExamen, setTipoExamen] = useState('MIR')
  const [customExamen, setCustomExamen] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const effectiveTipoExamen = tipoExamen === 'OTRO' ? customExamen : tipoExamen

  const handleGenerate = async () => {
    if (!file || !effectiveTipoExamen.trim()) return
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('count', String(count))
      form.append('tipoExamen', effectiveTipoExamen.trim())

      const res = await fetch('/api/flashcards/generate', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al generar')
        return
      }

      onGenerated(data.flashcards, data.tipoExamen)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {/* API key status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, padding: '12px 16px', border: inkBorder, background: keyConfigured ? '#e8f4e8' : '#fff8e0' }}>
        <span style={{ fontSize: 16 }}>{keyConfigured ? '✓' : '⚠'}</span>
        <span style={{ ...mono, fontSize: 10, letterSpacing: '0.08em' }}>
          {keyConfigured ? 'API KEY CONFIGURADA' : 'API KEY NO CONFIGURADA'}
        </span>
        <button
          onClick={onOpenKeyModal}
          style={{ ...mono, fontSize: 9, marginLeft: 'auto', background: 'transparent', border: inkBorder, padding: '6px 12px', cursor: 'pointer' }}
        >
          {keyConfigured ? 'CAMBIAR' : 'CONFIGURAR →'}
        </button>
      </div>

      {error && (
        <div style={{ ...mono, fontSize: 10, background: '#ffd0cc', border: inkBorder, padding: '10px 14px', marginBottom: 20 }}>
          {error.toUpperCase()}
        </div>
      )}

      {/* File upload */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>01 — DOCUMENTO</div>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: `3px dashed ${C.ink}`, padding: '32px 24px', textAlign: 'center',
            cursor: 'pointer', background: file ? '#e8f4e8' : C.cream,
            transition: 'background 0.2s',
          }}
        >
          <div style={{ ...bodyFont, fontSize: 14, marginBottom: 6 }}>
            {file ? `✓ ${file.name}` : 'Arrastra tu PDF o DOCX aquí'}
          </div>
          <div style={{ ...mono, fontSize: 9, opacity: 0.5 }}>
            {file ? `${(file.size / 1024).toFixed(0)} KB` : 'O haz click para seleccionar · máx 10 MB'}
          </div>
        </div>
        <input
          ref={inputRef} type="file" accept=".pdf,.docx"
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Count selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>02 — CANTIDAD</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {COUNT_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                ...mono, fontSize: 13, padding: '12px 28px',
                border: inkBorder, marginRight: -3,
                background: count === n ? C.ink : C.cream,
                color: count === n ? C.cream : C.ink,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Exam type selector */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', marginBottom: 10 }}>03 — TIPO DE EXAMEN</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
          {EXAM_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setTipoExamen(opt)}
              style={{
                ...mono, fontSize: 10, padding: '10px 18px',
                border: inkBorder, marginRight: -3, marginBottom: -3,
                background: tipoExamen === opt ? C.ink : C.cream,
                color: tipoExamen === opt ? C.cream : C.ink,
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          ))}
          <button
            onClick={() => setTipoExamen('OTRO')}
            style={{
              ...mono, fontSize: 10, padding: '10px 18px',
              border: inkBorder, marginRight: -3, marginBottom: -3,
              background: tipoExamen === 'OTRO' ? C.ink : C.cream,
              color: tipoExamen === 'OTRO' ? C.cream : C.ink,
              cursor: 'pointer',
            }}
          >
            OTRO
          </button>
        </div>
        {tipoExamen === 'OTRO' && (
          <input
            type="text"
            placeholder="Nombre del examen..."
            value={customExamen}
            onChange={e => setCustomExamen(e.target.value)}
            style={{
              ...bodyFont, width: '100%', padding: '12px 16px', marginTop: 8,
              border: inkBorder, background: C.cream, color: C.ink,
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !file || !keyConfigured || !effectiveTipoExamen.trim()}
        style={{
          ...disp, fontSize: 15, width: '100%',
          background: (loading || !file || !keyConfigured) ? '#aaa' : C.ink,
          color: C.cream, border: inkBorder, padding: '18px 24px',
          cursor: (loading || !file || !keyConfigured) ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? `GENERANDO ${count} FLASHCARDS...` : `GENERAR ${count} FLASHCARDS →`}
      </button>
    </div>
  )
}
