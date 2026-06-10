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
  const [previewIndex, setPreviewIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  // Dashboard state (saved)
  const [savedCards, setSavedCards] = useState<AiFlashcard[]>([])
  const [allCards, setAllCards] = useState<AiFlashcard[]>([])
  const [dashIndex, setDashIndex] = useState(0)
  const [filterEspecialidad, setFilterEspecialidad] = useState('')
  const [filterTipoExamen, setFilterTipoExamen] = useState('')
  const [loadingCards, setLoadingCards] = useState(false)

  useEffect(() => {
    fetch('/api/user/claude-key')
      .then(r => r.json())
      .then(d => setKeyConfigured(d.configured))
      .catch(() => {})
  }, [])

  const loadSavedCards = useCallback(async () => {
    setLoadingCards(true)
    try {
      const params = new URLSearchParams()
      if (filterEspecialidad) params.set('especialidad', filterEspecialidad)
      if (filterTipoExamen) params.set('tipoExamen', filterTipoExamen)
      const res = await fetch(`/api/flashcards?${params}`)
      const data = await res.json()
      const cards = data.flashcards || []
      setSavedCards(cards)
      if (!filterEspecialidad && !filterTipoExamen) {
        setAllCards(cards)
      }
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
    if (cards.length === 0) return
    setPreview(cards)
    setPreviewTipoExamen(tipoExamen)
    setPreviewIndex(0)
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
    try {
      const res = await fetch(`/api/flashcards/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedCards(prev => {
          const next = prev.filter(c => c.id !== id)
          setDashIndex(i => Math.min(i, Math.max(0, next.length - 1)))
          return next
        })
        setAllCards(prev => prev.filter(c => c.id !== id))
      }
    } catch {
      // silent
    }
  }

  const especialidades = [...new Set(allCards.map(c => c.especialidad))].sort()
  const tiposExamen = [...new Set(allCards.map(c => c.tipoExamen))].sort()

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
          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <button
              onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
              disabled={previewIndex === 0}
              style={{
                ...mono, fontSize: 11, padding: '10px 18px', border: inkBorder,
                background: 'transparent', color: C.ink, cursor: previewIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: previewIndex === 0 ? 0.3 : 1,
              }}
            >
              ← ANTERIOR
            </button>
            <span style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: C.ink, opacity: 0.6 }}>
              {previewIndex + 1} / {preview.length}
            </span>
            <button
              onClick={() => setPreviewIndex(i => Math.min(preview.length - 1, i + 1))}
              disabled={previewIndex === preview.length - 1}
              style={{
                ...mono, fontSize: 11, padding: '10px 18px', border: inkBorder,
                background: 'transparent', color: C.ink,
                cursor: previewIndex === preview.length - 1 ? 'not-allowed' : 'pointer',
                opacity: previewIndex === preview.length - 1 ? 0.3 : 1,
              }}
            >
              SIGUIENTE →
            </button>
          </div>

          {/* Single card */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
            <AiFlipCard key={previewIndex} card={{ ...preview[previewIndex], tipoExamen: previewTipoExamen }} />
          </div>

          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center',
            background: C.cream, border: inkBorder, padding: '16px 24px',
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
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 32 }}>
            <select
              value={filterEspecialidad}
              onChange={e => { setFilterEspecialidad(e.target.value); setDashIndex(0) }}
              style={{ ...mono, fontSize: 10, padding: '8px 14px', border: inkBorder, background: C.cream, cursor: 'pointer' }}
            >
              <option value="">TODAS LAS ESPECIALIDADES</option>
              {especialidades.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
            </select>
            <select
              value={filterTipoExamen}
              onChange={e => { setFilterTipoExamen(e.target.value); setDashIndex(0) }}
              style={{ ...mono, fontSize: 10, padding: '8px 14px', border: inkBorder, background: C.cream, cursor: 'pointer' }}
            >
              <option value="">TODOS LOS EXÁMENES</option>
              {tiposExamen.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <button
              disabled
              style={{
                ...mono, fontSize: 10, letterSpacing: '0.08em',
                background: '#ccc', color: C.cream, border: inkBorder,
                padding: '8px 20px', cursor: 'not-allowed', opacity: 0.5,
              }}
              title="Próximamente"
            >
              ↓ DESCARGAR PDF
            </button>
            {(filterEspecialidad || filterTipoExamen) && (
              <button
                onClick={() => { setFilterEspecialidad(''); setFilterTipoExamen(''); setDashIndex(0) }}
                style={{ ...mono, fontSize: 9, background: 'transparent', border: inkBorder, padding: '8px 14px', cursor: 'pointer', opacity: 0.6 }}
              >
                LIMPIAR FILTROS
              </button>
            )}
          </div>

          {loadingCards ? (
            <div style={{ ...mono, fontSize: 12, opacity: 0.5 }}>CARGANDO...</div>
          ) : savedCards.length === 0 ? (
            <div style={{ ...bodyFont, opacity: 0.5, fontSize: 16 }}>
              No hay flashcards guardadas{filterEspecialidad || filterTipoExamen ? ' con estos filtros' : ''}.
            </div>
          ) : (
            <div>
              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <button
                  onClick={() => setDashIndex(i => Math.max(0, i - 1))}
                  disabled={dashIndex === 0}
                  style={{
                    ...mono, fontSize: 11, padding: '10px 18px', border: inkBorder,
                    background: 'transparent', color: C.ink, cursor: dashIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: dashIndex === 0 ? 0.3 : 1,
                  }}
                >
                  ← ANTERIOR
                </button>
                <span style={{ ...mono, fontSize: 10, letterSpacing: '0.1em', color: C.ink, opacity: 0.6 }}>
                  {dashIndex + 1} / {savedCards.length}
                </span>
                <button
                  onClick={() => setDashIndex(i => Math.min(savedCards.length - 1, i + 1))}
                  disabled={dashIndex === savedCards.length - 1}
                  style={{
                    ...mono, fontSize: 11, padding: '10px 18px', border: inkBorder,
                    background: 'transparent', color: C.ink,
                    cursor: dashIndex === savedCards.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: dashIndex === savedCards.length - 1 ? 0.3 : 1,
                  }}
                >
                  SIGUIENTE →
                </button>
              </div>

              {/* Single card */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <AiFlipCard key={dashIndex} card={savedCards[dashIndex]} onDelete={handleDelete} />
              </div>
            </div>
          )}
        </div>
      )}

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
