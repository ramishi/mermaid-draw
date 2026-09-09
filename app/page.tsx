'use client'

import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Canvas } from '@/components/Canvas'
import { TopBar } from '@/components/TopBar'
import { ZoomControls } from '@/components/ZoomControls'
import { SelectionToolbar } from '@/components/SelectionToolbar'
import { InspectorPanel } from '@/components/Inspector/InspectorPanel'
import { CommandPalette } from '@/components/CommandPalette'
import { PreviewModal } from '@/components/PreviewModal'

function EditorContent() {
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
      }}
    >
      {/* Top bar — full width, always visible */}
      <TopBar
        inspectorOpen={inspectorOpen}
        onToggleInspector={() => setInspectorOpen((v) => !v)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenPreview={() => setPreviewOpen(true)}
      />

      {/* Canvas + inspector row */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1, background: 'var(--surface)' }}>
          <Canvas
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenInspector={() => setInspectorOpen(true)}
          />

          {/* Zoom controls — bottom-right */}
          <ZoomControls />

          {/* Selection toolbar — floats above multi-selection */}
          <SelectionToolbar />
        </div>

        {/* Right Inspector panel */}
        {inspectorOpen && (
          <InspectorPanel
            onCollapse={() => setInspectorOpen(false)}
          />
        )}
      </div>

      {/* Command Palette */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {/* Preview modal — on demand */}
      {previewOpen && <PreviewModal onClose={() => setPreviewOpen(false)} />}
    </div>
  )
}

export default function Page() {
  return (
    <ReactFlowProvider>
      <EditorContent />
    </ReactFlowProvider>
  )
}
