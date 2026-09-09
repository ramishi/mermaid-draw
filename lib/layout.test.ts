import assert from 'node:assert/strict'
import test from 'node:test'
import type { Edge, Node } from '@xyflow/react'
import { applyDagreLayout } from './layout.ts'
import type { FlowNodeData } from './store.ts'

const nodes: Node<FlowNodeData>[] = [
  {
    id: 'wide',
    type: 'flowNode',
    position: { x: 0, y: 0 },
    measured: { width: 320, height: 100 },
    data: { label: 'A long measured node', shape: 'rectangle' },
  },
  {
    id: 'narrow',
    type: 'flowNode',
    position: { x: 0, y: 0 },
    measured: { width: 80, height: 60 },
    data: { label: 'B', shape: 'rectangle' },
  },
  {
    id: 'target',
    type: 'flowNode',
    position: { x: 0, y: 0 },
    measured: { width: 100, height: 60 },
    data: { label: 'Target', shape: 'rectangle' },
  },
]

const edges: Edge[] = [
  { id: 'wide-target', source: 'wide', target: 'target' },
  { id: 'narrow-target', source: 'narrow', target: 'target' },
]

test('uses measured node widths and configured spacing', () => {
  const laidOut = applyDagreLayout(nodes, edges, 'TD', { nodeSpacing: 120 })
  const wide = laidOut.find((node) => node.id === 'wide')!
  const narrow = laidOut.find((node) => node.id === 'narrow')!

  assert.ok(Math.abs(wide.position.x - narrow.position.x) > 180)
})

test('keeps a dense measured chain non-overlapping in TD and LR layouts', () => {
  const denseNodes: Node<FlowNodeData>[] = Array.from({ length: 12 }, (_, index) => ({
    id: `dense-${index}`,
    type: 'flowNode',
    position: { x: 0, y: 0 },
    measured: { width: 90 + (index % 3) * 45, height: 50 + (index % 2) * 20 },
    data: { label: `Dense node ${index}`, shape: 'rectangle' },
  }))
  const denseEdges: Edge[] = denseNodes.slice(1).map((node, index) => ({
    id: `dense-edge-${index}`,
    source: denseNodes[index].id,
    target: node.id,
  }))

  for (const direction of ['TD', 'LR'] as const) {
    const result = applyDagreLayout(denseNodes, denseEdges, direction, { layoutPadding: 80 })
    for (let index = 0; index < result.length - 1; index += 1) {
      const current = result[index]
      const next = result[index + 1]
      const currentWidth = current.measured?.width ?? 150
      const currentHeight = current.measured?.height ?? 60
      const nextWidth = next.measured?.width ?? 150
      const nextHeight = next.measured?.height ?? 60
      const overlaps = current.position.x < next.position.x + nextWidth &&
        current.position.x + currentWidth > next.position.x &&
        current.position.y < next.position.y + nextHeight &&
        current.position.y + currentHeight > next.position.y
      assert.equal(overlaps, false, `${direction} layout overlaps dense nodes ${index} and ${index + 1}`)
    }
  }
})
