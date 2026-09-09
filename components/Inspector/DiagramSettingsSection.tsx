'use client'

import { useShallow } from 'zustand/react/shallow'
import { useFlowStore, type Direction } from '@/lib/store'
import { applyLayout } from '@/lib/layout'
import { DIRECTIONS, ROUTING_OPTIONS } from '@/components/ShapeIcons'

const NEU_BG = 'var(--neu-bg)'

function NeuBtn({
  onClick,
  active,
  children,
  title,
}: {
  onClick?: () => void
  active?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: NEU_BG,
        border: 'none',
        borderRadius: 8,
        boxShadow: active ? 'var(--neu-shadow-inset)' : 'var(--neu-shadow-raised)',
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: 500,
        color: active ? '#4F46E5' : '#6B7280',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
    >
      {children}
    </button>
  )
}

const subLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#9ca3af',
  marginBottom: 6,
}

const selectStyle: React.CSSProperties = {
  background: NEU_BG,
  boxShadow: 'var(--neu-shadow-concave)',
  border: 'none',
  borderRadius: 8,
  padding: '5px 8px',
  fontSize: 11,
  color: '#374151',
  outline: 'none',
  cursor: 'pointer',
  width: '100%',
}

export function DiagramSettingsSection() {
  const {
    direction,
    nodeSpacing,
    rankSpacing,
    layoutPadding,
    gridVisible,
    snapToGrid,
    gridSize,
    defaultEdgeRouting,
    defaultEdgeAnimated,
    renderNodeHtml,
    setDirection,
    setNodeSpacing,
    setRankSpacing,
    setLayoutPadding,
    setGridVisible,
    setSnapToGrid,
    setGridSize,
    setDefaultEdgeRouting,
    setDefaultEdgeAnimated,
    setRenderNodeHtml,
    setNodes,
  } = useFlowStore(
    useShallow((s) => ({
      direction: s.direction,
      nodeSpacing: s.nodeSpacing,
      rankSpacing: s.rankSpacing,
      layoutPadding: s.layoutPadding,
      gridVisible: s.gridVisible,
      snapToGrid: s.snapToGrid,
      gridSize: s.gridSize,
      defaultEdgeRouting: s.defaultEdgeRouting,
      defaultEdgeAnimated: s.defaultEdgeAnimated,
      renderNodeHtml: s.renderNodeHtml,
      setDirection: s.setDirection,
      setNodeSpacing: s.setNodeSpacing,
      setRankSpacing: s.setRankSpacing,
      setLayoutPadding: s.setLayoutPadding,
      setGridVisible: s.setGridVisible,
      setSnapToGrid: s.setSnapToGrid,
      setGridSize: s.setGridSize,
      setDefaultEdgeRouting: s.setDefaultEdgeRouting,
      setDefaultEdgeAnimated: s.setDefaultEdgeAnimated,
      setRenderNodeHtml: s.setRenderNodeHtml,
      setNodes: s.setNodes,
    }))
  )

  const handleDirectionChange = async (dir: Direction) => {
    setDirection(dir)
    const { nodes, edges, layoutEngine, nodeSpacing, rankSpacing, layoutPadding } = useFlowStore.getState()
    if (nodes.length > 0) setNodes(await applyLayout(nodes, edges, dir, { layoutEngine, nodeSpacing, rankSpacing, layoutPadding }))
  }

  return (
    <div>
      <div
        style={{
          background: NEU_BG,
          borderRadius: 14,
          boxShadow: 'var(--neu-shadow-concave)',
          padding: '14px',
        }}
      >
        {/* Layout */}
        <div style={subLabelStyle}>Layout Direction</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {DIRECTIONS.map(({ value, label, title }) => (
            <NeuBtn key={value} onClick={() => handleDirectionChange(value)} active={direction === value} title={title}>
              {label}
            </NeuBtn>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <label style={subLabelStyle}>
            Node gap
            <input
              type="number"
              min="0"
              value={nodeSpacing}
              onChange={(e) => setNodeSpacing(Number(e.target.value))}
              style={{ ...selectStyle, marginTop: 4 }}
              aria-label="Node spacing"
            />
          </label>
          <label style={subLabelStyle}>
            Rank gap
            <input
              type="number"
              min="0"
              value={rankSpacing}
              onChange={(e) => setRankSpacing(Number(e.target.value))}
              style={{ ...selectStyle, marginTop: 4 }}
              aria-label="Rank spacing"
            />
          </label>
        </div>
        <label style={{ ...subLabelStyle, display: 'block', marginBottom: 14 }}>
          Outer padding
          <input
            type="number"
            min="0"
            max="200"
            value={layoutPadding}
            onChange={(e) => setLayoutPadding(Number(e.target.value))}
            style={{ ...selectStyle, marginTop: 4 }}
            aria-label="Outer layout padding"
          />
        </label>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          <label style={{ ...subLabelStyle, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
            <input type="checkbox" checked={gridVisible} onChange={(e) => setGridVisible(e.target.checked)} />
            Show grid
          </label>
          <label style={{ ...subLabelStyle, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
            <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
            Snap to grid
          </label>
          <label style={{ ...subLabelStyle, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
            <input type="checkbox" checked={renderNodeHtml} onChange={(e) => setRenderNodeHtml(e.target.checked)} />
            Render HTML in labels
          </label>
          <label style={subLabelStyle}>
            Grid size
            <input
              type="number"
              min="4"
              max="64"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              style={{ ...selectStyle, marginTop: 4 }}
              aria-label="Grid size"
            />
          </label>
        </div>

        {/* Edge defaults */}
        <div style={subLabelStyle}>Edge routing</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {ROUTING_OPTIONS.map(({ value, label }) => (
            <NeuBtn
              key={value}
              onClick={() => setDefaultEdgeRouting(value)}
              active={defaultEdgeRouting === value}
              title={`${label} routing`}
            >
              {label}
            </NeuBtn>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <NeuBtn
            onClick={() => setDefaultEdgeAnimated(!defaultEdgeAnimated)}
            active={defaultEdgeAnimated}
            title="Toggle edge animation"
          >
            {defaultEdgeAnimated ? 'Animated on' : 'Animated off'}
          </NeuBtn>
        </div>

      </div>
    </div>
  )
}
