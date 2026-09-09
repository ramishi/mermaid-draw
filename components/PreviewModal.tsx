'use client'

import { useEffect, useRef, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import mermaid from 'mermaid'
import { useFlowStore } from '@/lib/store'
import { serialize } from '@/lib/serializer'
import { downloadMmd } from '@/lib/fileio'
import { exportCanvas, type CanvasExportFormat } from '@/lib/export'

let mermaidInit = false
let renderId = 0

const NEU_BG = 'var(--neu-bg)'

function DiagramView({ syntax }: { syntax: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const id = `mermaid-preview-${++renderId}`
    mermaid.render(id, syntax).then(({ svg }) => {
      if (ref.current) { ref.current.innerHTML = svg; setError(null) }
    }).catch((err) => {
      document.getElementById(id)?.remove()
      setError(err instanceof Error ? err.message : 'Render error')
    })
  }, [syntax])

  if (error) return (
    <div style={{ fontSize: 11, color: '#ef4444', fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: 16 }}>
      {error}
    </div>
  )
  return <div ref={ref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }} />
}

function ExportBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: NEU_BG,
        border: 'none',
        borderRadius: 10,
        boxShadow: 'var(--neu-shadow-raised)',
        padding: '7px 14px',
        fontSize: 12,
        fontWeight: 500,
        color: '#6B7280',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'box-shadow 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

interface PreviewModalProps {
  onClose: () => void
}

export function PreviewModal({ onClose }: PreviewModalProps) {
  const [copied, setCopied] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const { fitView, getViewport, setViewport } = useReactFlow()

  const { nodes, edges, direction, defaultEdgeRouting } = useFlowStore()
  const syntax = serialize(nodes, edges, { direction, defaultEdgeRouting })
  const hasNodes = nodes.length > 0

  useEffect(() => {
    if (!mermaidInit) {
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })
      mermaidInit = true
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(syntax)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownloadMmd = () => {
    const state = useFlowStore.getState()
    downloadMmd(state.nodes, state.edges, { direction: state.direction, defaultEdgeRouting: state.defaultEdgeRouting })
  }

  const handleExport = async (format: CanvasExportFormat) => {
    const prev = getViewport()
    try {
      await fitView({ padding: 0.1, duration: 0 })
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
      await exportCanvas(format)
    } catch {
      setExportError('Export failed')
      setTimeout(() => setExportError(null), 3000)
    } finally {
      await setViewport(prev, { duration: 0 })
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <div
        style={{
          background: NEU_BG,
          borderRadius: 24,
          boxShadow: 'var(--neu-shadow-raised)',
          width: '100%',
          maxWidth: 960,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(163,177,198,0.3)', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Mermaid Preview</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {exportError && <span style={{ fontSize: 11, color: '#ef4444' }}>{exportError}</span>}
            <ExportBtn label="Copy syntax" onClick={handleCopy} />
            <ExportBtn label=".mmd" onClick={handleDownloadMmd} disabled={!hasNodes} />
            <ExportBtn label="SVG" onClick={() => handleExport('svg')} disabled={!hasNodes} />
            <ExportBtn label="PNG" onClick={() => handleExport('png')} disabled={!hasNodes} />
            <ExportBtn label="PDF" onClick={() => handleExport('pdf')} disabled={!hasNodes} />
            <button
              onClick={onClose}
              style={{
                background: NEU_BG, border: 'none', borderRadius: 10,
                boxShadow: 'var(--neu-shadow-raised)', width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#9ca3af', fontSize: 18,
              }}
            >×</button>
          </div>
        </div>

        {/* Diagram */}
        <div style={{ flex: 1, overflow: 'auto', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasNodes ? <DiagramView syntax={syntax} /> : (
            <div style={{ color: '#9ca3af', fontSize: 13 }}>Canvas is empty — add nodes to preview.</div>
          )}
        </div>

        {/* Syntax */}
        <div style={{ background: '#1E2130', padding: '14px 20px', maxHeight: 160, overflow: 'auto', flexShrink: 0, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <pre style={{ margin: 0, flex: 1, fontSize: 11, color: '#86efac', fontFamily: 'monospace', whiteSpace: 'pre', lineHeight: 1.6 }}>
            {syntax || '— empty —'}
          </pre>
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent', border: '1px solid rgba(134,239,172,0.3)', borderRadius: 8,
              padding: '4px 10px', fontSize: 11, color: copied ? '#86efac' : '#6b7280',
              cursor: 'pointer', flexShrink: 0, transition: 'color 0.15s',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
