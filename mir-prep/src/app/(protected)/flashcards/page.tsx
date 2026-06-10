'use client'

import { useState, useEffect, useCallback } from 'react'
import { C, mono, disp, bodyFont, inkBorder } from '@/lib/cm'
import AiFlipCard, { AiFlashcard } from '@/components/flashcards/AiFlipCard'
import ApiKeyModal from '@/components/flashcards/ApiKeyModal'
import GeneratorForm from '@/components/flashcards/GeneratorForm'

type PageState = 'generator' | 'preview' | 'dashboard'

export default function FlashcardsPage() {
  const [pageState, setPageState] = useState<PageState>('generator')
  const [keyConfigured, setKeyConfigured] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)

  // Preview state (not yet saved)
  const [preview, setPreview] = useState<AiFlashcard[]>([])
  const [previewTipoExamen, setPreviewTipoExamen] = useState('')
  const [saving, setSaving] = useState(false)

  // Dashboard state (saved)
  const [savedCards, setSavedCards] = useState<AiFlashcard[]>([])
  const [filterEspecialidad, setFilterEspecialidad] = useState('')
  const [filterTipoExamen, setFilterTipoExamen] = useState('')
  const [loadingCards, setLoadingCards] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Load key status on mount
  useEffect(() => {
    fetch('/api/user/claude-key')
      .then(r => r.json())
      .then(d => setKeyConfigured(d.configured))
      .catch(() => {})
  }, [])

  // Load saved cards whenever entering dashboard or filters change
  const loadSavedCards = useCallback(async () => {
    setLoadingCards(true)
    try {
      const params = new URLSearchParams()
      if (filterEspecialidad) params.set('especialidad', filterEspecialidad)
      if (filterTipoExamen) params.set('tipoExamen', filterTipoExamen)
      const res = await fetch(`/api/flashcards?${params}`)
      const data = await res.json()
      setSavedCards(data.flashcards || [])
    } catch {
      // silent
    } finally {
      setLoadingCards(false)
    }
  }, [filterEspecialidad, filterTipoExamen])

  useEffect(() => {
    if (pageState === 'dashboard') loadSavedCards()
  }, [pageState, loadSavedCards])

  const handleGenerated = (cards: AiFlashcard[], tipoExamen: string) => {
    setPreview(cards)
    setPreviewTipoExamen(tipoExamen)
    setPageState('preview')
  }

  const handleSaveBatch = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards: preview, tipoExamen: previewTipoExamen }),
      })
      if (res.ok) {
        setPreview([])
        setPageState('dashboard')
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleDiscardBatch = () => {
    setPreview([])
    setPageState('generator')
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/flashcards/${id}`, { method: 'DELETE' })
    setSavedCards(prev => prev.filter(c => c.id !== id))
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const params = new URLSearchParams()
      if (filterEspecialidad) params.set('especialidad', filterEspecialidad)
      if (filterTipoExamen) params.set('tipoExamen', filterTipoExamen)
      const res = await fetch(`/api/flashcards/pdf?${params}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'flashcards-mir-prep.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Unique filter values from saved cards
  const especialidades = [...new Set(savedCards.map(c => c.especialidad))].sort()
  const tiposExamen = [...new Set(savedCards.map(c => c.tipoExamen))].sort()

  return (
    <div style={{ ...bodyFont }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', opacity: 0.5, marginBottom: 10 }}>
          FLASHCARDS IA
        </div>
        <h1 style={{ ...disp, fontSize: 'clamp(2.5rem, 5vw, 5rem)', margin: 0 }}>
          {pageState === 'generator' && 'GENERAR FLASHCARDS'}
          {pageState === 'preview' && `PREVIEW — ${preview.length} TARJETAS`}
          {pageState === 'dashboard' && 'MIS FLASHCARDS'}
        </h1>
        {pageState === 'dashboard' && (
          <button
            onClick={() => setPageState('generator')}
            style={{ ...mono, fontSize: 10, marginTop: 16, background: 'transparent', border: inkBorder, padding: '8px 16px', cursor: 'pointer' }}
          >
            + GENERAR MÁS
          </button>
        )}
      </div>

      {/* GENERATOR STATE */}
      {pageState === 'generator' && (
        <GeneratorForm
          keyConfigured={keyConfigured}
          onOpenKeyModal={() => setShowKeyModal(true)}
          onGenerated={handleGenerated}
        />
      )}

      {/* PREVIEW STATE */}
      {pageState === 'preview' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
            {preview.map((card, i) => (
              <AiFlipCard key={i} card={{ ...card, tipoExamen: previewTipoExamen }} />
            ))}
          </div>

          {/* Batch action bar */}
          <div style={{
            position: 'sticky', bottom: 24,
            display: 'flex', gap: 12, justifyContent: 'center',
            background: C.cream, border: inkBorder, padding: '16px 24px',
            boxShadow: '0 -4px 24px rgba(26,26,24,0.08)',
          }}>
            <button
              onClick={handleSaveBatch}
              disabled={saving}
              style={{
                ...mono, fontSize: 11, letterSpacing: '0.08em',
                background: C.ink, color: C.cream, border: inkBorder,
                padding: '12px 28px', cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'GUARDANDO...' : `✓ GUARDAR ESTAS ${preview.length} FLASHCARDS`}
            </button>
            <button
              onClick={handleDiscardBatch}
              style={{
                ...mono, fontSize: 11, letterSpacing: '0.08em',
                background: 'transparent', color: C.ink, border: inkBorder,
                padding: '12px 28px', cursor: 'pointer',
              }}
            >
              ✗ ELIMINAR ESTAS FLASHCARDS
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD STATE */}
      {pageState === 'dashboard' && (
        <div>
          {/* Filter bar + PDF download */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 32 }}>
            <select
              value={filterEspecialidad}
              onChange={e => setFilterEspecialidad(e.target.value)}
              style={{ ...mono, fontSize: 10, padding: '8px 14px', border: inkBorder, background: C.cream, cursor: 'pointer' }}
            >
              <option value="">TODAS LAS ESPECIALIDADES</option>
              {especialidades.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
            </select>
            <select
              value={filterTipoExamen}
              onChange={e => setFilterTipoExamen(e.target.value)}
              style={{ ...mono, fontSize: 10, padding: '8px 14px', border: inkBorder, background: C.cream, cursor: 'pointer' }}
            >
              <option value="">TODOS LOS EXÁMENES</option>
              {tiposExamen.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || savedCards.length === 0}
              style={{
                ...mono, fontSize: 10, letterSpacing: '0.08em',
                background: savedCards.length === 0 ? '#ccc' : C.ink,
                color: C.cream, border: inkBorder,
                padding: '8px 20px', cursor: savedCards.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {downloadingPdf ? 'GENERANDO PDF...' : '↓ DESCARGAR PDF'}
            </button>
            {(filterEspecialidad || filterTipoExamen) && (
              <button
                onClick={() => { setFilterEspecialidad(''); setFilterTipoExamen('') }}
                style={{ ...mono, fontSize: 9, background: 'transparent', border: inkBorder, padding: '8px 14px', cursor: 'pointer', opacity: 0.6 }}
              >
                LIMPIAR FILTROS
              </button>
            )}
          </div>

          {/* Cards grid */}
          {loadingCards ? (
            <div style={{ ...mono, fontSize: 12, opacity: 0.5 }}>CARGANDO...</div>
          ) : savedCards.length === 0 ? (
            <div style={{ ...bodyFont, opacity: 0.5, fontSize: 16 }}>
              No hay flashcards guardadas{filterEspecialidad || filterTipoExamen ? ' con estos filtros' : ''}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {savedCards.map(card => (
                <AiFlipCard key={card.id} card={card} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <ApiKeyModal
          onClose={() => setShowKeyModal(false)}
          onSaved={() => {
            setKeyConfigured(true)
            setShowKeyModal(false)
          }}
        />
      )}
    </div>
  )
}
