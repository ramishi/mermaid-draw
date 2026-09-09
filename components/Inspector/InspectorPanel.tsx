'use client'

import { useShallow } from 'zustand/react/shallow'
import { useFlowStore } from '@/lib/store'
import { ObjectSettingsSection } from './ObjectSettingsSection'
import { DiagramSettingsSection } from './DiagramSettingsSection'

interface InspectorPanelProps {
  onCollapse: () => void
}

const NEU_BG = 'var(--neu-bg)'

export function InspectorPanel({ onCollapse }: InspectorPanelProps) {
  const selectedNodes = useFlowStore(useShallow((s) => s.nodes.filter((n) => n.selected)))
  const selectedEdges = useFlowStore(useShallow((s) => s.edges.filter((e) => e.selected)))
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0

  return (
    <div
      className="inspector-panel"
      style={{
        width: 320,
        height: '100vh',
        background: NEU_BG,
        boxShadow: 'var(--neu-shadow-raised)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(163,177,198,0.25)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
          {hasSelection ? 'Object' : 'Diagram'}
        </span>

        <button
          onClick={onCollapse}
          title="Collapse inspector"
          aria-label="Collapse inspector"
          style={{
            background: NEU_BG,
            border: 'none',
            borderRadius: 10,
            boxShadow: 'var(--neu-shadow-raised)',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9ca3af',
            fontSize: 14,
            transition: 'box-shadow 0.15s',
          }}
        >
          ×
        </button>
      </div>

      {/* Contextual content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 20px' }}>
        {hasSelection ? <ObjectSettingsSection /> : <DiagramSettingsSection />}
      </div>
    </div>
  )
}
