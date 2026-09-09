'use client'

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'

import { useFlowStore, type FlowNodeData, type NodeShape } from '@/lib/store'
import { FlowNode } from './NodeTypes/FlowNode'
import { FlowEdge } from './EdgeTypes/FlowEdge'
import { ShapeIcon, ALL_SHAPES } from '@/components/ShapeIcons'

const nodeTypes = { flowNode: FlowNode }
const edgeTypes = { flowEdge: FlowEdge }

type ContextMenuAction = 'duplicate' | 'group' | 'front' | 'style' | 'delete' | `add-to-group:${string}` | 'remove-from-group'
type ContextMenuState = {
  type: 'node' | 'edge'
  id: string
  x: number
  y: number
  shape?: NodeShape
  parentId?: string
}

interface CanvasInnerProps {
  onOpenPalette?: () => void
  onOpenInspector?: () => void
}

function getHiddenNodeIds(nodes: Node<FlowNodeData>[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const collapsedIds = new Set(nodes.filter((node) => node.data.collapsed).map((node) => node.id))
  const hiddenIds = new Set<string>()

  for (const node of nodes) {
    let parentId = node.parentId
    while (parentId) {
      if (collapsedIds.has(parentId)) {
        hiddenIds.add(node.id)
        break
      }
      parentId = byId.get(parentId)?.parentId
    }
  }

  return hiddenIds
}

function CanvasInner({ onOpenPalette, onOpenInspector }: CanvasInnerProps) {

  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, addNodeAtPosition,
    undo, redo, duplicateSelected, copySelected, pasteClipboard,
    deleteSelected, groupSelected, bringToFront,
    pushHistory,
    drawingShape, setDrawingShape,
    gridVisible, snapToGrid, gridSize,
  } = useFlowStore()
  const { screenToFlowPosition } = useReactFlow()

  // ── Draw-mode state ─────────────────────────────────────────────────────────
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      // Escape → cancel draw mode
      if (e.key === 'Escape') {
        setDrawingShape(null)
        setDragStart(null)
        setDragCurrent(null)
        return
      }

      // N → add node (when not typing)
      if (!isTyping && (e.key === 'n' || e.key === 'N')) {
        addNode()
        return
      }

      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+Z → undo
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      // Ctrl+Shift+Z or Ctrl+Y → redo
      if ((ctrl && e.shiftKey && e.key === 'z') || (ctrl && e.key === 'y')) {
        e.preventDefault()
        redo()
        return
      }

      // Ctrl+D → duplicate selected
      if (ctrl && e.key === 'd') {
        e.preventDefault()
        duplicateSelected()
        return
      }

      // Ctrl+C → copy selected
      if (ctrl && !e.shiftKey && e.key === 'c') {
        e.preventDefault()
        copySelected()
        return
      }

      // Ctrl+V → paste clipboard
      if (ctrl && !e.shiftKey && e.key === 'v') {
        e.preventDefault()
        pasteClipboard()
        return
      }

      // Ctrl+K / Meta+K → open command palette
      if (ctrl && e.key === 'k') {
        e.preventDefault()
        onOpenPalette?.()
        return
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [addNode, undo, redo, duplicateSelected, copySelected, pasteClipboard, setDrawingShape, onOpenPalette])

  const selectContextTarget = useCallback((type: ContextMenuState['type'], id: string) => {
    onNodesChange(nodes.map((node) => ({ type: 'select', id: node.id, selected: type === 'node' && node.id === id })))
    onEdgesChange(edges.map((edge) => ({ type: 'select', id: edge.id, selected: type === 'edge' && edge.id === id })))
  }, [edges, nodes, onEdgesChange, onNodesChange])

  const handleNodeContextMenu = useCallback((event: MouseEvent, node: Node<FlowNodeData>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!node.selected) selectContextTarget('node', node.id)
    setContextMenu({ type: 'node', id: node.id, x: event.clientX, y: event.clientY, shape: node.data.shape ?? 'rectangle', parentId: node.parentId })
  }, [selectContextTarget])

  const handleEdgeContextMenu = useCallback((event: MouseEvent, edge: Edge) => {
    event.preventDefault()
    event.stopPropagation()
    if (!edge.selected) selectContextTarget('edge', edge.id)
    setContextMenu({ type: 'edge', id: edge.id, x: event.clientX, y: event.clientY })
  }, [selectContextTarget])

  const handleContextMenuAction = useCallback((action: ContextMenuAction) => {
    setContextMenu(null)
    if (action === 'duplicate') duplicateSelected()
    if (action === 'group') groupSelected()
    if (action === 'front') bringToFront()
    if (action === 'delete') deleteSelected()
    if (action === 'style') onOpenInspector?.()
    if (action === 'remove-from-group') {
      const { nodes, setNodes } = useFlowStore.getState()
      const selected = nodes.filter((n) => n.selected && n.parentId)
      if (selected.length === 0) return
      const updated = nodes.map((n) => {
        if (!n.selected || !n.parentId) return n
        const parent = nodes.find((p) => p.id === n.parentId)
        const absPos = parent
          ? { x: parent.position.x + n.position.x, y: parent.position.y + n.position.y }
          : n.position
        return { ...n, parentId: undefined, extent: undefined, position: absPos }
      })
      setNodes([...updated.filter((n) => n.data.isSubgraph), ...updated.filter((n) => !n.data.isSubgraph)])
    }
    if (action.startsWith('add-to-group:')) {
      const groupId = action.slice('add-to-group:'.length)
      const { nodes, setNodes } = useFlowStore.getState()
      const parent = nodes.find((n) => n.id === groupId)
      if (!parent) return
      const updated = nodes.map((n) => {
        if (!n.selected || n.data.isSubgraph || n.parentId) return n
        return {
          ...n,
          parentId: groupId,
          position: { x: n.position.x - parent.position.x, y: n.position.y - parent.position.y },
        }
      })
      setNodes([...updated.filter((n) => n.data.isSubgraph), ...updated.filter((n) => !n.data.isSubgraph)])
    }
  }, [bringToFront, deleteSelected, duplicateSelected, groupSelected, onOpenInspector])

  const handleChangeShape = useCallback((shape: NodeShape) => {
    if (!contextMenu) return
    const { nodes, setNodes } = useFlowStore.getState()
    setNodes(nodes.map((n) => n.id === contextMenu.id ? { ...n, data: { ...n.data, shape } } : n))
    setContextMenu((prev) => prev ? { ...prev, shape } : prev)
  }, [contextMenu])

  const selectedFreeNodeCount = nodes.filter((node) => node.selected && !node.data.isSubgraph && !node.parentId).length
  const subgraphs = nodes.filter((n) => n.data.isSubgraph)

  type MenuItem = { action: ContextMenuAction; label: string; disabled?: boolean; danger?: boolean }

  const contextMenuItems: MenuItem[] = contextMenu?.type === 'node'
    ? [
        { action: 'duplicate', label: 'Duplicate' },
        { action: 'group', label: 'Group selection', disabled: selectedFreeNodeCount < 2 },
        // Add to group — one item per group, for free nodes only
        ...(!contextMenu.parentId && subgraphs.length > 0
          ? subgraphs.map((sg): MenuItem => ({
              action: `add-to-group:${sg.id}` as ContextMenuAction,
              label: `Add to group: ${sg.data.label || sg.id}`,
            }))
          : []),
        // Remove from group — for child nodes
        ...(contextMenu.parentId
          ? [{ action: 'remove-from-group' as ContextMenuAction, label: 'Remove from group' }]
          : []),
        { action: 'front', label: 'Bring to front' },
        { action: 'style', label: 'Edit style' },
        { action: 'delete', label: 'Delete', danger: true },
      ]
    : contextMenu
      ? [
          { action: 'style', label: 'Edit style' },
          { action: 'delete', label: 'Delete', danger: true },
        ]
      : []

  // ── Double-click on blank canvas → add node at cursor ─────────────────────
  const handleDoubleClick = (e: MouseEvent) => {
    if (drawingShape) return
    const target = e.target as Element
    if (target.closest('.react-flow__node')) return
    if (target.closest('.react-flow__edge')) return
    if (target.closest('.react-flow__controls')) return
    if (target.closest('.react-flow__minimap')) return
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNodeAtPosition(position)
  }

  // ── Draw-mode mouse handlers ────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawingShape) return
      const target = e.target as Element
      if (target.closest('.react-flow__node')) return
      if (target.closest('.react-flow__controls')) return
      if (target.closest('.react-flow__minimap')) return
      e.preventDefault()
      setDragStart({ x: e.clientX, y: e.clientY })
      setDragCurrent({ x: e.clientX, y: e.clientY })
    },
    [drawingShape],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragStart) return
      setDragCurrent({ x: e.clientX, y: e.clientY })
    },
    [dragStart],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragStart || !drawingShape) return
      const end = { x: e.clientX, y: e.clientY }

      const dx = Math.abs(end.x - dragStart.x)
      const dy = Math.abs(end.y - dragStart.y)

      const flowStart = screenToFlowPosition({ x: dragStart.x, y: dragStart.y })
      const flowEnd = screenToFlowPosition({ x: end.x, y: end.y })

      if (dx < 20 && dy < 20) {
        // Single click — create default-sized node
        addNodeAtPosition(flowStart, drawingShape)
      } else {
        const x = Math.min(flowStart.x, flowEnd.x)
        const y = Math.min(flowStart.y, flowEnd.y)
        const w = Math.abs(flowEnd.x - flowStart.x)
        const h = Math.abs(flowEnd.y - flowStart.y)
        addNodeAtPosition({ x, y }, drawingShape, w, h)
      }

      setDragStart(null)
      setDragCurrent(null)
      setDrawingShape(null)
    },
    [dragStart, drawingShape, screenToFlowPosition, addNodeAtPosition, setDrawingShape],
  )

  // ── Record drag in history; remove child from group if dragged outside ──────
  const handleNodeDragStop = useCallback(
    (_event: MouseEvent, draggedNode: Node<FlowNodeData>) => {
      pushHistory()

      // Child node dragged outside its parent → auto-remove from group
      if (draggedNode.parentId) {
        const { nodes, setNodes } = useFlowStore.getState()
        const parent = nodes.find((n) => n.id === draggedNode.parentId)
        if (parent) {
          const sgW = typeof parent.style?.width === 'number' ? parent.style.width : 320
          const sgH = typeof parent.style?.height === 'number' ? parent.style.height : 220
          const w = draggedNode.measured?.width ?? 150
          const h = draggedNode.measured?.height ?? 60
          // draggedNode.position is relative to parent; center outside bounds = exit
          const relCx = draggedNode.position.x + w / 2
          const relCy = draggedNode.position.y + h / 2
          if (relCx < 0 || relCx > sgW || relCy < 0 || relCy > sgH) {
            const absPos = {
              x: parent.position.x + draggedNode.position.x,
              y: parent.position.y + draggedNode.position.y,
            }
            setNodes([
              ...nodes.filter((n) => n.data.isSubgraph),
              ...nodes.filter((n) => !n.data.isSubgraph).map((n) => n.id === draggedNode.id
                ? { ...n, parentId: undefined, extent: undefined, position: absPos }
                : n
              ),
            ])
          }
        }
      }
    },
    [pushHistory]
  )

  const previewRect =
    dragStart && dragCurrent
      ? {
          left: Math.min(dragStart.x, dragCurrent.x),
          top: Math.min(dragStart.y, dragCurrent.y),
          width: Math.abs(dragCurrent.x - dragStart.x),
          height: Math.abs(dragCurrent.y - dragStart.y),
        }
      : null

  // Offset preview rect relative to wrapper element
  // eslint-disable-next-line react-hooks/refs
  const wrapperRect = wrapperRef.current?.getBoundingClientRect()
  const relativePreview = previewRect && wrapperRect
    ? {
        left: previewRect.left - wrapperRect.left,
        top: previewRect.top - wrapperRect.top,
        width: previewRect.width,
        height: previewRect.height,
      }
    : null

  const hiddenNodeIds = getHiddenNodeIds(nodes)
  const renderedNodes = nodes.map((node) => hiddenNodeIds.has(node.id) ? { ...node, hidden: true } : node)
  const renderedEdges = edges.map((edge) => hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target)
    ? { ...edge, hidden: true }
    : edge)

  return (
    <div
      ref={wrapperRef}
      className={`w-full h-full relative ${drawingShape ? 'cursor-crosshair' : ''}`}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <ReactFlow
        nodes={renderedNodes}
        edges={renderedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneContextMenu={(event) => {
          event.preventDefault()
          const target = event.target as Element
          if (!target.closest('.react-flow__node, .react-flow__edge')) setContextMenu(null)
        }}
        fitView
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        deleteKeyCode={['Backspace', 'Delete']}
        panOnDrag={drawingShape ? false : [1, 2]}
        selectionOnDrag={!drawingShape}
        multiSelectionKeyCode={['Shift', 'Control']}
        nodesDraggable={!drawingShape}
        style={{ background: 'var(--neu-bg)' }}
      >
        <>
          {gridVisible && <Background variant={BackgroundVariant.Dots} gap={gridSize} size={2} color="var(--canvas-grid)" />}
          <MiniMap
            pannable
            zoomable
            nodeColor="#94a3b8"
            maskColor="rgba(224, 229, 236, 0.65)"
            style={{ left: 16, bottom: 16, right: 'auto', borderRadius: 10 }}
          />
        </>
      </ReactFlow>

      {contextMenu && (
        <div
          data-context-menu
          onContextMenu={(event) => event.preventDefault()}
          onMouseDown={(event) => event.stopPropagation()}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: 168,
            padding: 6,
            borderRadius: 12,
            background: 'var(--neu-bg)',
            boxShadow: 'var(--neu-shadow-raised)',
            zIndex: 100,
          }}
        >
          {/* Shape picker — nodes only */}
          {contextMenu.type === 'node' && (
            <>
              <div style={{ padding: '4px 6px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Shape</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 22px)', gap: 3 }}>
                  {ALL_SHAPES.map(({ shape, label }) => (
                    <button
                      key={shape}
                      type="button"
                      title={label}
                      onClick={() => handleChangeShape(shape)}
                      style={{
                        width: 22, height: 22, borderRadius: 6, border: 'none',
                        background: 'var(--neu-bg)',
                        boxShadow: contextMenu.shape === shape ? 'var(--neu-shadow-inset)' : 'var(--neu-shadow-raised)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0,
                        color: contextMenu.shape === shape ? '#4F46E5' : '#6b7280',
                        transition: 'box-shadow 0.12s, color 0.12s',
                      }}
                    >
                      <ShapeIcon shape={shape} stroke={contextMenu.shape === shape ? '#4F46E5' : '#6b7280'} />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 1, background: 'rgba(163,177,198,0.35)', margin: '2px 4px 4px' }} />
            </>
          )}

          {/* Action items */}
          {contextMenuItems.map((item) => (
            <button
              key={item.action}
              type="button"
              disabled={item.disabled}
              onClick={() => handleContextMenuAction(item.action)}
              style={{
                display: 'block',
                width: '100%',
                padding: '7px 10px',
                border: 'none',
                borderRadius: 6,
                background: 'transparent',
                color: item.danger ? '#dc2626' : '#374151',
                textAlign: 'left',
                fontSize: 12,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.4 : 1,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {relativePreview && relativePreview.width > 4 && relativePreview.height > 4 && (
        <div
          className="absolute pointer-events-none border-2 border-dashed border-blue-500 bg-blue-50/30 rounded"
          style={relativePreview}
        />
      )}

      {nodes.length === 0 && !drawingShape && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400">
            <p className="text-lg font-medium">Canvas is empty</p>
            <p className="text-sm mt-1">
                Select a shape above and drag to draw, or press{' '}
              <kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-mono">N</kbd>{' '}
              to add a node. Drag on empty canvas to pan.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function Canvas({ onOpenPalette, onOpenInspector }: CanvasInnerProps) {
  return <CanvasInner onOpenPalette={onOpenPalette} onOpenInspector={onOpenInspector} />
}
