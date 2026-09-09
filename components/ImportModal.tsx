'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { parseMermaidFlowchart } from '@/lib/parser'
import type { ParseResult } from '@/lib/parser'
import { useFlowStore } from '@/lib/store'

interface ImportModalProps {
  onClose: () => void
}

const NEU_BG = 'var(--neu-bg)'

export function ImportModal({ onClose }: ImportModalProps) {
  const importDiagram = useFlowStore((s) => s.importDiagram)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const processText = useCallback((text: string, name: string) => {
    setFileName(name)
    // Strip ```mermaid ... ``` fences common in .md files
    const fenceMatch = text.match(/```mermaid\s*\n([\s\S]*?)```/)
    setResult(parseMermaidFlowchart(fenceMatch ? fenceMatch[1].trim() : text.trim()))
  }, [])

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => processText(e.target?.result as string, file.name)
    reader.readAsText(file)
  }, [processText])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = () => {
    if (!result || result.error) return
    const { nodes, edges, direction, theme, look, curveStyle } = result
    importDiagram(nodes, edges, { direction, theme, look, curveStyle })
    onClose()
  }

  const canImport = result !== null && result.error === null && result.nodes.length > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-labelledby="import-title"
        aria-modal="true"
        style={{
          background: NEU_BG,
          borderRadius: 20,
          boxShadow: 'var(--neu-shadow-raised)',
          width: 480,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(163,177,198,0.25)' }}>
          <div>
            <div id="import-title" style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Import Mermaid</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Select a .mmd or .md file to load onto the canvas</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1, padding: '4px 6px', borderRadius: 8 }}
          >
            ×
          </button>
        </div>

        {/* Drop zone */}
        <div style={{ padding: '20px 20px 16px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mmd,.md,.txt"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? '#4F46E5' : 'rgba(163,177,198,0.5)'}`,
              borderRadius: 14,
              padding: '32px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              background: dragging ? 'rgba(79,70,229,0.04)' : 'rgba(163,177,198,0.06)',
              transition: 'border-color 0.15s, background 0.15s',
              userSelect: 'none',
            }}
            role="button"
            tabIndex={0}
            aria-label="Click or drop a .mmd file to import"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
          >
            {/* Icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#4F46E5' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            {fileName ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{fileName}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Click to replace</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Drop a .mmd or .md file here</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>or click to browse</div>
              </div>
            )}
          </div>

          {/* Parse result */}
          <div style={{ minHeight: 20, marginTop: 10, fontSize: 11, textAlign: 'center' }} aria-live="polite">
            {result && result.error && (
              <span style={{ color: '#ef4444' }}>{result.error}</span>
            )}
            {result && !result.error && (
              <span style={{ color: '#059669' }}>
                {result.nodes.length} node{result.nodes.length !== 1 ? 's' : ''}, {result.edges.length} edge{result.edges.length !== 1 ? 's' : ''} ready to import
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px 16px', borderTop: '1px solid rgba(163,177,198,0.2)' }}>
          <button
            onClick={onClose}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 500, color: '#6b7280', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!canImport}
            style={{
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 500,
              color: 'white',
              background: '#4F46E5',
              border: 'none',
              borderRadius: 8,
              cursor: canImport ? 'pointer' : 'not-allowed',
              opacity: canImport ? 1 : 0.4,
              boxShadow: canImport ? '0 2px 8px rgba(79,70,229,0.35)' : 'none',
              transition: 'opacity 0.15s, box-shadow 0.15s',
            }}
          >
            Import to canvas
          </button>
        </div>
      </div>
    </div>
  )
}
