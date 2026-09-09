'use client'

import { useViewport } from '@xyflow/react'
import { useShallow } from 'zustand/react/shallow'
import { useFlowStore } from '@/lib/store'

const NEU_BG = 'var(--neu-bg)'

function ToolBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#6B7280',
        fontSize: 14,
        transition: 'background 0.1s, color 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.05)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: 'rgba(163,177,198,0.4)', margin: '0 2px' }} />
}

// Align icons
const AlignLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="3" y2="21" /><rect x="7" y="6" width="14" height="5" rx="1" /><rect x="7" y="13" width="8" height="5" rx="1" />
  </svg>
)
const AlignCenterHIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21" /><rect x="5" y="6" width="14" height="5" rx="1" /><rect x="8" y="13" width="8" height="5" rx="1" />
  </svg>
)
const AlignRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="21" y1="3" x2="21" y2="21" /><rect x="3" y="6" width="14" height="5" rx="1" /><rect x="9" y="13" width="8" height="5" rx="1" />
  </svg>
)
const AlignTopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="21" y2="3" /><rect x="6" y="7" width="5" height="14" rx="1" /><rect x="13" y="7" width="5" height="8" rx="1" />
  </svg>
)
const AlignMiddleVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><rect x="6" y="5" width="5" height="14" rx="1" /><rect x="13" y="8" width="5" height="8" rx="1" />
  </svg>
)
const AlignBottomIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="21" x2="21" y2="21" /><rect x="6" y="3" width="5" height="14" rx="1" /><rect x="13" y="9" width="5" height="8" rx="1" />
  </svg>
)
const DistributeHIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="3" y2="21" /><line x1="21" y1="3" x2="21" y2="21" /><rect x="8" y="7" width="8" height="10" rx="1" />
  </svg>
)
const DistributeVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="21" y2="3" /><line x1="3" y1="21" x2="21" y2="21" /><rect x="7" y="8" width="10" height="8" rx="1" />
  </svg>
)

export function SelectionToolbar() {
  const { zoom, x: vpX, y: vpY } = useViewport()

  const { alignSelected, distributeSelected } = useFlowStore(
    useShallow((s) => ({
      alignSelected: s.alignSelected,
      distributeSelected: s.distributeSelected,
    }))
  )

  const selectedNodes = useFlowStore(useShallow((s) => s.nodes.filter((n) => n.selected && !n.hidden)))

  if (selectedNodes.length < 2) return null

  // Compute screen-space bounding box top center
  const positions = selectedNodes.map((n) => ({
    left: n.position.x,
    right: n.position.x + (n.measured?.width ?? 150),
    top: n.position.y,
  }))
  const minLeft = Math.min(...positions.map((p) => p.left))
  const maxRight = Math.max(...positions.map((p) => p.right))
  const minTop = Math.min(...positions.map((p) => p.top))

  const screenX = (minLeft + maxRight) / 2 * zoom + vpX
  const screenY = minTop * zoom + vpY - 52

  return (
    <div
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        zIndex: 25,
      }}
    >
      <div
        style={{
          background: NEU_BG,
          borderRadius: 12,
          boxShadow: 'var(--neu-shadow-raised)',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          whiteSpace: 'nowrap',
        }}
      >
        <ToolBtn onClick={() => alignSelected('left')} title="Align left"><AlignLeftIcon /></ToolBtn>
        <ToolBtn onClick={() => alignSelected('center')} title="Align center"><AlignCenterHIcon /></ToolBtn>
        <ToolBtn onClick={() => alignSelected('right')} title="Align right"><AlignRightIcon /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => alignSelected('top')} title="Align top"><AlignTopIcon /></ToolBtn>
        <ToolBtn onClick={() => alignSelected('middle')} title="Align middle"><AlignMiddleVIcon /></ToolBtn>
        <ToolBtn onClick={() => alignSelected('bottom')} title="Align bottom"><AlignBottomIcon /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => distributeSelected('horizontal')} title="Distribute horizontally"><DistributeHIcon /></ToolBtn>
        <ToolBtn onClick={() => distributeSelected('vertical')} title="Distribute vertically"><DistributeVIcon /></ToolBtn>
      </div>
    </div>
  )
}
