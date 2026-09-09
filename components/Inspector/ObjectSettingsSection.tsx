'use client'

import { useShallow } from 'zustand/react/shallow'
import { useFlowStore, type ArrowType, type Direction, type EdgeRouting, type EdgeStyle, type FlowEdgeData, type NodeShape } from '@/lib/store'
import { ShapeIcon, ALL_SHAPES } from '@/components/ShapeIcons'

const NEU_BG = 'var(--neu-bg)'

function NeuBtn({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'box-shadow 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function ColorSwatch({
  value,
  defaultVal,
  onChange,
  label,
}: {
  value?: string
  defaultVal: string
  onChange: (color: string) => void
  label: string
}) {
  return (
    <label
      title={label}
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: value ?? defaultVal,
          boxShadow: 'var(--neu-shadow-raised)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <input
          type="color"
          defaultValue={value ?? defaultVal}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            border: 'none',
            padding: 0,
          }}
          aria-label={label}
        />
      </div>
      <span style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.04em' }}>{label}</span>
    </label>
  )
}

export function ObjectSettingsSection() {
  const { updateNodeStyle, updateEdgeType, updateSubgraphDirection, toggleSubgraph, setNodes } = useFlowStore(
    useShallow((s) => ({
      updateNodeStyle: s.updateNodeStyle,
      updateEdgeType: s.updateEdgeType,
      updateSubgraphDirection: s.updateSubgraphDirection,
      toggleSubgraph: s.toggleSubgraph,
      setNodes: s.setNodes,
    }))
  )

  const changeShape = (shape: NodeShape) => {
    const { nodes } = useFlowStore.getState()
    setNodes(nodes.map((n) =>
      n.selected && !n.data.isSubgraph ? { ...n, data: { ...n.data, shape } } : n
    ))
  }

  const selectedNodes = useFlowStore(useShallow((s) => s.nodes.filter((n) => n.selected)))
  const selectedEdges = useFlowStore(useShallow((s) => s.edges.filter((e) => e.selected)))
  const selectedSubgraph = selectedNodes.length === 1 && selectedNodes[0].data.isSubgraph ? selectedNodes[0] : null

  const hasNodeSelection = selectedNodes.length > 0
  const hasEdgeSelection = selectedEdges.length > 0

  const firstEdgeData = hasEdgeSelection ? (selectedEdges[0].data as FlowEdgeData | undefined) : undefined
  const activeEdgeStyle = firstEdgeData?.edgeStyle ?? 'solid'
  const activeArrowType = firstEdgeData?.arrowType ?? 'arrow'
  const activeRouting = firstEdgeData?.routing ?? 'bezier'
  const activeAnimated = firstEdgeData?.animated ?? false

  if (!hasNodeSelection && !hasEdgeSelection) {
    return (
      <div
        style={{
          background: NEU_BG,
          borderRadius: 14,
          boxShadow: 'var(--neu-shadow-concave)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div style={{ fontSize: 24, opacity: 0.3 }}>◻</div>
        <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
          Select a node or edge to edit its properties
        </div>
      </div>
    )
  }

  return (
    <div>

      {/* Node Properties */}
      {hasNodeSelection && (
        <div
          style={{
            background: NEU_BG,
            borderRadius: 14,
            boxShadow: 'var(--neu-shadow-concave)',
            padding: '14px',
            marginBottom: hasEdgeSelection ? 10 : 0,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            {selectedNodes.length === 1 ? '1 node selected' : `${selectedNodes.length} nodes selected`}
          </div>

          {/* Color swatches */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <ColorSwatch
              key={selectedNodes.map(n => n.id).join('-') + '-fill'}
              value={selectedNodes[0].data.fillColor}
              defaultVal="#ffffff"
              label="Fill"
              onChange={(color) => selectedNodes.forEach((n) => updateNodeStyle(n.id, { fillColor: color }))}
            />
            <ColorSwatch
              key={selectedNodes.map(n => n.id).join('-') + '-stroke'}
              value={selectedNodes[0].data.strokeColor}
              defaultVal="#9ca3af"
              label="Border"
              onChange={(color) => selectedNodes.forEach((n) => updateNodeStyle(n.id, { strokeColor: color }))}
            />
            <ColorSwatch
              key={selectedNodes.map(n => n.id).join('-') + '-text'}
              value={selectedNodes[0].data.textColor}
              defaultVal="#1f2937"
              label="Text"
              onChange={(color) => selectedNodes.forEach((n) => updateNodeStyle(n.id, { textColor: color }))}
            />
          </div>

          {/* Shape picker — only for non-subgraph single/multi node selection */}
          {selectedNodes.some((n) => !n.data.isSubgraph) && (
            <>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6, marginTop: 4 }}>Shape</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12 }}>
                {ALL_SHAPES.map(({ shape, label }) => {
                  const activeShape = selectedNodes.find((n) => !n.data.isSubgraph)?.data.shape
                  return (
                    <button
                      key={shape}
                      onClick={() => changeShape(shape)}
                      title={label}
                      aria-label={label}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: 'none',
                        background: 'var(--neu-bg)',
                        boxShadow: activeShape === shape ? 'var(--neu-shadow-inset)' : 'var(--neu-shadow-raised)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: activeShape === shape ? '#4F46E5' : '#6b7280',
                        padding: 0,
                        transition: 'box-shadow 0.15s, color 0.15s',
                      }}
                    >
                      <ShapeIcon shape={shape} stroke={activeShape === shape ? '#4F46E5' : '#6b7280'} />
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <NeuBtn
            onClick={() => selectedNodes.forEach((n) =>
              updateNodeStyle(n.id, { fillColor: undefined, strokeColor: undefined, textColor: undefined })
            )}
          >
            Reset colors
          </NeuBtn>
          {selectedSubgraph && (
            <>
            <label style={{ display: 'block', marginTop: 14, fontSize: 10, color: '#9ca3af' }}>
              Group direction
              <select
                value={selectedSubgraph.data.subgraphDirection ?? 'TD'}
                onChange={(event) => updateSubgraphDirection(selectedSubgraph.id, event.target.value as Direction)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 4,
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: 8,
                  background: NEU_BG,
                  boxShadow: 'var(--neu-shadow-inset)',
                  color: '#374151',
                  fontSize: 11,
                }}
                aria-label="Group direction"
              >
                <option value="TD">Top → Down</option>
                <option value="LR">Left → Right</option>
                <option value="BT">Bottom → Top</option>
                <option value="RL">Right → Left</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 10, color: '#9ca3af', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!selectedSubgraph.data.collapsed}
                onChange={() => toggleSubgraph(selectedSubgraph.id)}
              />
              Collapsed
            </label>
            </>
          )}
        </div>
      )}

      {/* Edge Properties */}
      {hasEdgeSelection && (
        <div
          style={{
            background: NEU_BG,
            borderRadius: 14,
            boxShadow: 'var(--neu-shadow-concave)',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            {selectedEdges.length === 1 ? '1 edge selected' : `${selectedEdges.length} edges selected`}
          </div>

          {/* Edge style */}
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>Line style</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['solid', 'dashed', 'thick'] as EdgeStyle[]).map((style) => (
              <NeuBtn
                key={style}
                onClick={() => selectedEdges.forEach((e) => updateEdgeType(e.id, { edgeStyle: style }))}
                active={activeEdgeStyle === style}
                title={`${style} line`}
              >
                {style === 'solid' ? '─' : style === 'dashed' ? '╌' : '━'}
              </NeuBtn>
            ))}
          </div>

          {/* Arrow type */}
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>Arrow</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {(
              [
                { type: 'arrow', label: '→', ariaLabel: 'Arrow' },
                { type: 'none', label: '─', ariaLabel: 'None' },
                { type: 'bidirectional', label: '↔', ariaLabel: 'Bidirectional' },
                { type: 'circle', label: '○', ariaLabel: 'Circle' },
                { type: 'cross', label: '✕', ariaLabel: 'Cross' },
              ] as { type: ArrowType; label: string; ariaLabel: string }[]
            ).map(({ type, label, ariaLabel }) => (
              <NeuBtn
                key={type}
                onClick={() => selectedEdges.forEach((e) => updateEdgeType(e.id, { arrowType: type }))}
                active={activeArrowType === type}
                title={ariaLabel}
              >
                {label}
              </NeuBtn>
            ))}
          </div>
          {/* Routing */}
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>Routing</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {(['bezier', 'straight', 'step', 'smoothstep'] as EdgeRouting[]).map((routing) => (
              <NeuBtn
                key={routing}
                onClick={() => selectedEdges.forEach((e) => updateEdgeType(e.id, { routing }))}
                active={activeRouting === routing}
                title={`${routing} routing`}
              >
                {routing === 'bezier' ? 'Curve' : routing === 'straight' ? 'Line' : routing === 'step' ? 'Ortho' : 'Smooth'}
              </NeuBtn>
            ))}
          </div>

          <NeuBtn
            onClick={() => selectedEdges.forEach((e) => updateEdgeType(e.id, { animated: !activeAnimated }))}
            active={activeAnimated}
            title="Toggle edge animation"
          >
            {activeAnimated ? 'Motion on' : 'Motion off'}
          </NeuBtn>

          <div style={{ height: 1, background: 'rgba(163,177,198,0.25)', margin: '12px 0' }} />

          {/* Edge color */}
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>Color</div>
          <ColorSwatch
            key={selectedEdges.map(e => e.id).join('-')}
            value={(selectedEdges[0].data as FlowEdgeData | undefined)?.strokeColor}
            defaultVal="#9ca3af"
            label="Edge color"
            onChange={(color) => selectedEdges.forEach((e) => updateEdgeType(e.id, { strokeColor: color }))}
          />
        </div>
      )}
    </div>
  )
}
