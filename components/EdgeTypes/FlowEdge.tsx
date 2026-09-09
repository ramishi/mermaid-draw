'use client'

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
  useReactFlow,
} from '@xyflow/react'
import { useCallback, useState } from 'react'
import { useFlowStore, type FlowEdgeData } from '@/lib/store'

type SelectionState = 'none' | 'selected' | 'connected' | 'dimmed'

export function FlowEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  markerStart,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as FlowEdgeData | undefined
  const routing = edgeData?.routing ?? 'bezier'
  const pathArgs = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition }
  const [edgePath, labelX, labelY] = routing === 'straight'
    ? getStraightPath(pathArgs)
    : routing === 'step'
      ? getSmoothStepPath({ ...pathArgs, borderRadius: 0 })
      : routing === 'smoothstep'
        ? getSmoothStepPath({ ...pathArgs, borderRadius: 8 })
        : getBezierPath(pathArgs)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState((label as string) ?? '')
  const updateEdgeLabel = useFlowStore((s) => s.updateEdgeLabel)
  const { deleteElements } = useReactFlow()

  const commitLabel = useCallback(() => {
    updateEdgeLabel(id, draft.trim())
    setEditing(false)
  }, [draft, id, updateEdgeLabel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') commitLabel()
    if (e.key === 'Escape') setEditing(false)
  }, [commitLabel])

  // ── Selection state ────────────────────────────────────────────────────────
  const selectionState: SelectionState = useFlowStore((s) => {
    const anySelected = s.nodes.some((n) => n.selected) || s.edges.some((e) => e.selected)
    if (!anySelected) return 'none'
    if (selected) return 'selected'
    const srcSelected = s.nodes.some((n) => n.id === source && n.selected)
    const tgtSelected = s.nodes.some((n) => n.id === target && n.selected)
    if (srcSelected || tgtSelected) return 'connected'
    return 'dimmed'
  })

  const edgeStyle = edgeData?.edgeStyle ?? 'solid'
  const baseStrokeColor = edgeData?.strokeColor ?? '#9ca3af'
  const strokeColor =
    selectionState === 'selected' ? '#4F46E5'
    : selectionState === 'connected' ? '#818cf8'
    : baseStrokeColor

  const strokeDasharray = edgeData?.strokeDasharray ?? (edgeStyle === 'dashed' ? '7 4' : undefined)
  const baseStrokeWidth = edgeData?.strokeWidth ?? (edgeStyle === 'thick' ? 4 : 2)
  const strokeWidth = selectionState === 'selected' ? baseStrokeWidth + 1 : baseStrokeWidth
  const animated = edgeData?.animated ?? false

  const pathStyle: React.CSSProperties = {
    strokeDasharray,
    strokeWidth,
    stroke: strokeColor,
    opacity: selectionState === 'dimmed' ? 0.15 : 1,
    filter: selectionState === 'selected'
      ? 'drop-shadow(0 0 3px rgba(79,70,229,0.8)) drop-shadow(0 0 6px rgba(79,70,229,0.4))'
      : selectionState === 'connected'
        ? 'drop-shadow(0 0 2px rgba(99,102,241,0.5))'
        : undefined,
    transition: 'opacity 0.18s, stroke 0.18s',
  }

  const displayLabel = label as string | undefined

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        className={animated ? 'flow-edge-animated' : undefined}
        style={pathStyle}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={handleKeyDown}
              placeholder="label…"
              className="text-xs px-2 py-0.5 rounded border border-blue-400 bg-white shadow-sm outline-none w-28 text-center"
            />
          ) : selected ? (
            /* Selected state: show label (if any) + action pill */
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {displayLabel && (
                <span
                  className="text-xs px-2 py-0.5 rounded bg-white border border-indigo-300 shadow-sm text-gray-700 cursor-pointer"
                  onDoubleClick={(e) => { e.stopPropagation(); setDraft((label as string) ?? ''); setEditing(true) }}
                >
                  {displayLabel}
                </span>
              )}
              <div style={{
                display: 'flex', gap: 3, alignItems: 'center',
                background: 'var(--neu-bg)',
                borderRadius: 20,
                boxShadow: 'var(--neu-shadow-raised)',
                padding: '2px 4px',
              }}>
                {/* Edit label */}
                <button
                  title="Edit label"
                  onClick={(e) => { e.stopPropagation(); setDraft((label as string) ?? ''); setEditing(true) }}
                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✎
                </button>
                {/* Delete */}
                <button
                  title="Delete edge"
                  onClick={(e) => { e.stopPropagation(); deleteElements({ edges: [{ id }] }) }}
                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ⌫
                </button>
              </div>
            </div>
          ) : displayLabel ? (
            <span
              className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 shadow-sm text-gray-700 cursor-pointer hover:border-blue-300"
              onDoubleClick={(e) => { e.stopPropagation(); setDraft((label as string) ?? ''); setEditing(true) }}
            >
              {displayLabel}
            </span>
          ) : (
            <span
              className="text-xs px-1 py-0.5 rounded text-gray-300 cursor-pointer hover:text-gray-400 hover:bg-white/80 select-none"
              onDoubleClick={(e) => { e.stopPropagation(); setDraft(''); setEditing(true) }}
            >
              ✎
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
