import assert from 'node:assert/strict'
import test from 'node:test'
import type { Edge, Node } from '@xyflow/react'
import { applyElkLayout } from './elk-layout.ts'
import type { FlowNodeData } from './store.ts'

test('lays out a measured graph with layered ELK positions', async () => {
  const nodes: Node<FlowNodeData>[] = [
    {
      id: 'source',
      type: 'flowNode',
      position: { x: 0, y: 0 },
      measured: { width: 220, height: 80 },
      data: { label: 'Source', shape: 'rectangle' },
    },
    {
      id: 'target',
      type: 'flowNode',
      position: { x: 0, y: 0 },
      measured: { width: 100, height: 60 },
      data: { label: 'Target', shape: 'rectangle' },
    },
  ]
  const edges: Edge[] = [{ id: 'edge', source: 'source', target: 'target' }]

  const result = await applyElkLayout(nodes, edges, 'TD')
  const source = result.find((node) => node.id === 'source')!
  const target = result.find((node) => node.id === 'target')!

  assert.ok(target.position.y > source.position.y)
  assert.deepStrictEqual(source.measured, { width: 220, height: 80 })
})
