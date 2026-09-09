'use client'

import { useReactFlow, useViewport } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { useFlowStore } from '@/lib/store'

const NEU_BG = 'var(--neu-bg)'

function ZoomBtn({
  onClick,
  title,
  disabled,
  children,
}: {
  onClick: () => void
  title: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      style={{
        background: NEU_BG,
        border: 'none',
        borderRadius: 10,
        boxShadow: 'var(--neu-shadow-raised)',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        color: '#6B7280',
        fontSize: 16,
        fontWeight: 500,
        transition: 'box-shadow 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

export function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { zoom } = useViewport()
  const selectedNodes = useFlowStore(useShallow((s) => s.nodes.filter((node) => node.selected)))

  const handleFit = () => fitView({ duration: 400, padding: 0.1 })

  const handleFitSelection = () => {
    if (selectedNodes.length === 0) return
    fitView({ nodes: selectedNodes, duration: 400, padding: 0.2 })
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: NEU_BG,
        borderRadius: 50,
        boxShadow: 'var(--neu-shadow-raised)',
        padding: '6px 10px',
        pointerEvents: 'auto',
        zIndex: 10,
      }}
    >
      <ZoomBtn onClick={() => zoomOut()} title="Zoom out">−</ZoomBtn>

      <button
        onClick={handleFit}
        title="Fit view"
        style={{
          background: NEU_BG,
          border: 'none',
          borderRadius: 8,
          boxShadow: 'var(--neu-shadow-concave)',
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 600,
          color: '#6B7280',
          cursor: 'pointer',
          minWidth: 48,
          textAlign: 'center',
        }}
      >
        {Math.round(zoom * 100)}%
      </button>

      <ZoomBtn onClick={handleFitSelection} title="Fit selection" disabled={selectedNodes.length === 0}>
        ◇
      </ZoomBtn>
      <ZoomBtn onClick={() => zoomIn()} title="Zoom in">+</ZoomBtn>
    </div>
  )
}
