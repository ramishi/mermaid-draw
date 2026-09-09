'use client'

import { useEffect, useRef, useState } from 'react'
import { useReactFlow, useNodesInitialized } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { useFlowStore, DEFAULT_EDITOR_SETTINGS } from '@/lib/store'
import { applyLayout } from '@/lib/layout'
import { downloadMmd, saveDiagramJson, loadDiagramJson } from '@/lib/fileio'
import { exportCanvas, type CanvasExportFormat } from '@/lib/export'
import { ImportModal } from '@/components/ImportModal'
import { ToolPalette } from '@/components/ToolPalette'

const NEU_BG = 'var(--neu-bg)'

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
  minWidth,
}: {
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
  minWidth?: number
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        background: NEU_BG,
        border: 'none',
        borderRadius: 10,
        boxShadow: active ? 'var(--neu-shadow-inset)' : 'var(--neu-shadow-raised)',
        height: 32,
        minWidth: minWidth ?? 32,
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        color: active ? '#4F46E5' : '#6B7280',
        fontSize: 11,
        fontWeight: 500,
        transition: 'box-shadow 0.15s, color 0.15s',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: 'rgba(163,177,198,0.4)', margin: '0 4px', flexShrink: 0 }} />
}

// ── Icons ────────────────────────────────────────────────────────────────────

const IconUndo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </svg>
)

const IconRedo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 14 20 9 15 4" /><path d="M4 20v-7a4 4 0 0 1 4-4h12" />
  </svg>
)

const IconAutoLayout = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="4" rx="1" />
    <rect x="2" y="16" width="6" height="4" rx="1" />
    <rect x="16" y="16" width="6" height="4" rx="1" />
    <line x1="12" y1="5" x2="12" y2="11" />
    <line x1="5" y1="11" x2="19" y2="11" />
    <line x1="5" y1="11" x2="5" y2="16" />
    <line x1="19" y1="11" x2="19" y2="16" />
  </svg>
)

const IconPreview = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconExport = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconLayers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)

const IconChevron = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ── Export dropdown ──────────────────────────────────────────────────────────

function ExportDropdown({ onClose, onExport, nodesEmpty }: { onClose: () => void; onExport: (f: CanvasExportFormat) => void; nodesEmpty: boolean }) {
  const items: { label: string; format: CanvasExportFormat }[] = [
    { label: 'PNG image', format: 'png' },
    { label: 'SVG vector', format: 'svg' },
    { label: 'WebP image', format: 'webp' },
    { label: 'PDF document', format: 'pdf' },
  ]
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        background: NEU_BG,
        borderRadius: 14,
        boxShadow: 'var(--neu-shadow-raised)',
        padding: 6,
        zIndex: 50,
        minWidth: 160,
      }}
    >
      {items.map(({ label, format }) => (
        <button
          key={format}
          disabled={nodesEmpty}
          onClick={() => { onExport(format); onClose() }}
          style={{
            display: 'block', width: '100%', padding: '7px 12px',
            border: 'none', borderRadius: 8, background: 'transparent',
            color: '#374151', textAlign: 'left', fontSize: 12,
            cursor: nodesEmpty ? 'not-allowed' : 'pointer',
            opacity: nodesEmpty ? 0.4 : 1,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── File menu ────────────────────────────────────────────────────────────────

interface FileMenuProps {
  onClose: () => void
}

function FileMenu({ onClose }: FileMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { loadDiagram } = useFlowStore(useShallow((s) => ({ loadDiagram: s.loadDiagram })))
  const nodesLength = useFlowStore((s) => s.nodes.length)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !importOpen) onClose() }
    const handleClick = (e: MouseEvent) => {
      if (importOpen) return
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose, importOpen])

  const handleNew = () => {
    loadDiagram([], [], DEFAULT_EDITOR_SETTINGS)
    onClose()
  }

  const handleLoad = async () => {
    try {
      setError(null)
      const doc = await loadDiagramJson()
      loadDiagram(doc.nodes, doc.edges, doc.settings, doc.name)
      onClose()
    } catch (err) {
      if (err instanceof Error && err.message !== 'No file selected') {
        setError('Invalid file')
        setTimeout(() => setError(null), 3000)
      }
    }
  }

  const handleSave = () => {
    const { nodes, edges, direction, theme, look, curveStyle, layoutEngine, nodeSpacing, rankSpacing, layoutPadding, gridVisible, snapToGrid, gridSize, defaultEdgeRouting, defaultEdgeAnimated, renderNodeHtml, diagramName } = useFlowStore.getState()
    saveDiagramJson(nodes, edges, { direction, theme, look, curveStyle, layoutEngine, nodeSpacing, rankSpacing, layoutPadding, gridVisible, snapToGrid, gridSize, defaultEdgeRouting, defaultEdgeAnimated, renderNodeHtml }, diagramName)
    onClose()
  }

  const handleDownloadMmd = () => {
    const { nodes, edges, direction, defaultEdgeRouting, diagramName } = useFlowStore.getState()
    downloadMmd(nodes, edges, { direction, defaultEdgeRouting }, diagramName)
    onClose()
  }

  const itemStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '7px 14px',
    border: 'none', borderRadius: 8, background: 'transparent',
    color: '#374151', textAlign: 'left', fontSize: 12,
    cursor: 'pointer', transition: 'background 0.1s',
  }
  const disabledStyle: React.CSSProperties = { ...itemStyle, opacity: 0.4, cursor: 'not-allowed' }
  const sepStyle: React.CSSProperties = { height: 1, background: 'rgba(163,177,198,0.35)', margin: '4px 8px' }

  return (
    <>
      {importOpen && <ImportModal onClose={() => { setImportOpen(false); onClose() }} />}
      <div
        ref={ref}
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          background: NEU_BG,
          borderRadius: 14,
          boxShadow: 'var(--neu-shadow-raised)',
          padding: 6,
          zIndex: 50,
          minWidth: 200,
        }}
      >
        {error && <div style={{ fontSize: 11, color: '#ef4444', padding: '4px 14px 2px' }}>{error}</div>}
        <button style={itemStyle} onClick={handleNew}>New diagram</button>
        <div style={sepStyle} />
        <button style={itemStyle} onClick={handleLoad}>Open JSON…</button>
        <button style={nodesLength === 0 ? disabledStyle : itemStyle} disabled={nodesLength === 0} onClick={handleSave}>Save JSON</button>
        <div style={sepStyle} />
        <button style={itemStyle} onClick={() => setImportOpen(true)}>Import .mmd…</button>
        <button style={nodesLength === 0 ? disabledStyle : itemStyle} disabled={nodesLength === 0} onClick={handleDownloadMmd}>Download .mmd</button>
      </div>
    </>
  )
}

// ── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  inspectorOpen: boolean
  onToggleInspector: () => void
  onOpenPalette?: () => void
  onOpenPreview: () => void
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'

export function TopBar({ inspectorOpen, onToggleInspector, onOpenPalette, onOpenPreview }: TopBarProps) {
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const { fitView, getViewport, setViewport } = useReactFlow()
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: true })

  const { undo, redo, setNodes, diagramName, setDiagramName } = useFlowStore(
    useShallow((s) => ({
      undo: s.undo,
      redo: s.redo,
      setNodes: s.setNodes,
      diagramName: s.diagramName,
      setDiagramName: s.setDiagramName,
    }))
  )

  const pastLength = useFlowStore((s) => s.past.length)
  const futureLength = useFlowStore((s) => s.future.length)
  const nodesLength = useFlowStore((s) => s.nodes.length)
  const layoutDisabled = nodesLength === 0 || !nodesInitialized

  const startEditingTitle = () => {
    setTitleDraft(diagramName)
    setEditingTitle(true)
    requestAnimationFrame(() => titleInputRef.current?.select())
  }

  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    if (trimmed) setDiagramName(trimmed)
    setEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitTitle()
    if (e.key === 'Escape') setEditingTitle(false)
  }

  const handleAutoLayout = async () => {
    if (layoutDisabled) return
    const { nodes, edges, direction, layoutEngine, nodeSpacing, rankSpacing, layoutPadding } = useFlowStore.getState()
    setNodes(await applyLayout(nodes, edges, direction, { layoutEngine, nodeSpacing, rankSpacing, layoutPadding }))
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
    <div style={{ pointerEvents: 'auto' }}>
      <div
        style={{
          background: NEU_BG,
          boxShadow: 'var(--neu-shadow-raised)',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 4,
        }}
      >
        {/* ── LEFT: app identity + doc name + file menu ───────────────────── */}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', letterSpacing: '-0.02em', userSelect: 'none', flexShrink: 0 }}>
          MermaidDraw
        </span>
        <span style={{ fontSize: 10, color: '#9ca3af', marginRight: 6, userSelect: 'none', flexShrink: 0 }}>
          v{APP_VERSION}
        </span>
        <div style={{ width: 1, height: 16, background: 'rgba(163,177,198,0.5)', marginRight: 6, flexShrink: 0 }} />
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
            style={{
              fontSize: 13, fontWeight: 500, color: '#374151', letterSpacing: '-0.01em',
              background: 'var(--neu-bg)', border: '1.5px solid #6366f1', borderRadius: 6,
              padding: '2px 6px', height: 28, outline: 'none', width: 180, marginRight: 4,
            }}
          />
        ) : (
          <span
            onClick={startEditingTitle}
            title="Click to rename"
            style={{
              fontSize: 13, fontWeight: 500, color: '#6b7280', marginRight: 4,
              letterSpacing: '-0.01em', userSelect: 'none', cursor: 'pointer',
              padding: '2px 6px', borderRadius: 6, transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(163,177,198,0.18)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            {diagramName}
          </span>
        )}

        <div style={{ position: 'relative' }}>
          <Btn
            onClick={() => { setFileMenuOpen((v) => !v); setExportOpen(false) }}
            active={fileMenuOpen}
            title="File menu"
          >
            File <IconChevron />
          </Btn>
          {fileMenuOpen && <FileMenu onClose={() => setFileMenuOpen(false)} />}
        </div>

        {/* ── CENTER: tool dock ──────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ToolPalette />
        </div>
        <div style={{ flex: 1 }} />

        {/* ── RIGHT: history + layout + actions ──────────────────────────── */}
        <Btn onClick={undo} disabled={pastLength === 0} title="Undo (Ctrl+Z)"><IconUndo /></Btn>
        <Btn onClick={redo} disabled={futureLength === 0} title="Redo (Ctrl+Shift+Z)"><IconRedo /></Btn>

        <Divider />

        <Btn onClick={handleAutoLayout} disabled={layoutDisabled} title="Auto-arrange layout">
          <IconAutoLayout />
          <span>Layout</span>
        </Btn>

        <Divider />

        <Btn onClick={onOpenPreview} title="Preview Mermaid output">
          <IconPreview />
          <span>Preview</span>
        </Btn>

        {/* Export dropdown */}
        <div style={{ position: 'relative' }}>
          <Btn
            onClick={() => { setExportOpen((v) => !v); setFileMenuOpen(false) }}
            active={exportOpen}
            title="Export diagram"
            disabled={nodesLength === 0}
          >
            <IconExport />
            <span>Export</span>
          </Btn>
          {exportOpen && (
            <ExportDropdown
              onClose={() => setExportOpen(false)}
              onExport={handleExport}
              nodesEmpty={nodesLength === 0}
            />
          )}
        </div>

        {exportError && <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 4 }}>{exportError}</span>}

        <Divider />

        {onOpenPalette && (
          <Btn onClick={onOpenPalette} title="Command palette (⌘K)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Btn>
        )}

        <Btn onClick={onToggleInspector} active={inspectorOpen} title="Properties panel">
          <IconLayers />
        </Btn>
      </div>
    </div>
  )
}
