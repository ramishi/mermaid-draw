'use client'

import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useFlowStore, type NodeShape } from '@/lib/store'
import { ShapeIcon, ALL_SHAPES } from '@/components/ShapeIcons'
import { ShapePickerPopover } from '@/components/ShapePickerPopover'

const NEU_BG = 'var(--neu-bg)'

function DockBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: 'none',
        background: NEU_BG,
        boxShadow: active ? 'var(--neu-shadow-inset)' : 'var(--neu-shadow-raised)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: active ? '#4F46E5' : '#6B7280',
        transition: 'box-shadow 0.15s, color 0.15s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 22, background: 'rgba(163,177,198,0.4)', margin: '0 4px' }} />
}

const IconPointer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" />
  </svg>
)

const IconSubgraph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <rect x="7" y="7" width="4" height="4" rx="1" />
    <rect x="13" y="7" width="4" height="4" rx="1" />
    <rect x="7" y="13" width="4" height="4" rx="1" />
  </svg>
)

// Last non-null shape used, so the shape button shows a useful icon after selection
const DEFAULT_SHAPE: NodeShape = 'rectangle'

export function ToolPalette() {
  const { drawingShape, setDrawingShape, addSubgraph } = useFlowStore(
    useShallow((s) => ({
      drawingShape: s.drawingShape,
      setDrawingShape: s.setDrawingShape,
      addSubgraph: s.addSubgraph,
    }))
  )
  const [shapePickerOpen, setShapePickerOpen] = useState(false)

  // Derive which shape icon to show on the shape button
  const shapeEntry = ALL_SHAPES.find((s) => s.shape === drawingShape) ?? ALL_SHAPES.find((s) => s.shape === DEFAULT_SHAPE)!

  const isInDrawMode = drawingShape !== null

  const handleShapeBtn = () => {
    if (!shapePickerOpen) {
      setShapePickerOpen(true)
    } else {
      setShapePickerOpen(false)
    }
  }

  const handleSelect = () => {
    setDrawingShape(null)
    setShapePickerOpen(false)
  }

  const isShapeActive = isInDrawMode

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Dock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* Select */}
        <DockBtn onClick={handleSelect} active={!isInDrawMode} title="Select (Esc)">
          <IconPointer />
        </DockBtn>

        <Divider />

        {/* Shape picker trigger — shows current/last shape */}
        <div style={{ position: 'relative' }}>
          <DockBtn
            onClick={handleShapeBtn}
            active={isShapeActive || shapePickerOpen}
            title={`Draw ${shapeEntry.label} (click to change)`}
          >
            <ShapeIcon shape={shapeEntry.shape} stroke={(isShapeActive || shapePickerOpen) ? '#4F46E5' : '#6b7280'} />
          </DockBtn>
          {shapePickerOpen && (
            <ShapePickerPopover onClose={() => setShapePickerOpen(false)} />
          )}
        </div>

        <Divider />

        {/* Subgraph */}
        <DockBtn onClick={() => addSubgraph()} title="Add group / subgraph">
          <IconSubgraph />
        </DockBtn>
      </div>

      {/* Draw mode hint — pops out below the toolbar */}
      {isInDrawMode && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#4F46E5',
            color: 'white',
            fontSize: 11,
            fontWeight: 500,
            padding: '5px 12px',
            borderRadius: 50,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
            zIndex: 30,
          }}
        >
          {drawingShape} — click &amp; drag on canvas — Esc to cancel
        </div>
      )}
    </div>
  )
}
