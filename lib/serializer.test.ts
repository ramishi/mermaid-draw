/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert'
import test from 'node:test'
import { serialize } from './serializer.ts'
import type { NodeShape } from './store.ts'

test('serialize shapes', () => {
  const shapes: NodeShape[] = [
    'rounded',
    'stadium',
    'subroutine',
    'cylinder',
    'circle',
    'double-circle',
    'diamond',
    'hexagon',
    'parallelogram',
    'parallelogram-alt',
    'trapezoid',
    'trapezoid-alt',
    'asymmetric',
    'rectangle'
  ]

  const nodes = shapes.map((shape, i) => ({
    id: `n${i}`,
    data: { label: `Label ${shape}`, shape },
    position: { x: 0, y: 0 }
  }))

  const output = serialize(nodes as any, [])

  assert.ok(output.includes('n0("Label rounded")'), 'rounded failed')
  assert.ok(output.includes('n1(["Label stadium"])'), 'stadium failed')
  assert.ok(output.includes('n2[["Label subroutine"]]'), 'subroutine failed')
  assert.ok(output.includes('n3[("Label cylinder")]'), 'cylinder failed')
  assert.ok(output.includes('n4(("Label circle"))'), 'circle failed')
  assert.ok(output.includes('n5((("Label double-circle")))'), 'double-circle failed')
  assert.ok(output.includes('n6{"Label diamond"}'), 'diamond failed')
  assert.ok(output.includes('n7{{"Label hexagon"}}'), 'hexagon failed')
  assert.ok(output.includes('n8[/"Label parallelogram"/]'), 'parallelogram failed')
  assert.ok(output.includes('n9[\\"Label parallelogram-alt"\\ ]'.replace('\\ ', '\\')), 'parallelogram-alt failed')
  assert.ok(output.includes('n10[/"Label trapezoid"\\ ]'.replace('\\ ', '\\')), 'trapezoid failed')
  assert.ok(output.includes('n11[\\"Label trapezoid-alt"/]'), 'trapezoid-alt failed')
  assert.ok(output.includes('n12>"Label asymmetric"]'), 'asymmetric failed')
  assert.ok(output.includes('n13["Label rectangle"]'), 'rectangle failed')
})

test('serialize default shape', () => {
  const nodes = [
    {
      id: 'n_default',
      data: { label: 'Default' },
      position: { x: 0, y: 0 }
    }
  ]
  const output = serialize(nodes as any, [])
  assert.ok(output.includes('n_default["Default"]'))
})

test('does not export editor-only edge routing or animation', () => {
  const nodes = [
    { id: 'source', data: { label: 'Source', shape: 'rectangle' }, position: { x: 0, y: 0 } },
    { id: 'target', data: { label: 'Target', shape: 'rectangle' }, position: { x: 0, y: 0 } },
  ]
  const edges = [{
    id: 'edge_1',
    source: 'source',
    target: 'target',
    data: { routing: 'smoothstep', animated: true },
  }]

  const output = serialize(nodes as any, edges as any)

  assert.ok(output.includes('source --> target'))
  assert.ok(!output.includes('smoothstep'))
  assert.ok(!output.includes('animated'))
})

test('serializes subgraph direction and custom styles', () => {
  const nodes = [
    {
      id: 'sg_1',
      position: { x: 0, y: 0 },
      data: {
        label: 'Frontend',
        shape: 'rectangle',
        isSubgraph: true,
        subgraphDirection: 'LR',
        fillColor: '#eef2ff',
        strokeColor: '#4f46e5',
      },
    },
    {
      id: 'app',
      position: { x: 20, y: 20 },
      parentId: 'sg_1',
      data: { label: 'App', shape: 'rectangle' },
    },
  ]

  const output = serialize(nodes as any, [])

  assert.ok(output.includes('direction LR'))
  assert.ok(output.includes('style sg_1 fill:#eef2ff,stroke:#4f46e5'))
})

test('serializes nested subgraphs with independent directions', () => {
  const nodes = [
    { id: 'outer', position: { x: 0, y: 0 }, data: { label: 'Outer', shape: 'rectangle', isSubgraph: true, subgraphDirection: 'TB' } },
    { id: 'inner', position: { x: 20, y: 20 }, parentId: 'outer', data: { label: 'Inner', shape: 'rectangle', isSubgraph: true, subgraphDirection: 'LR' } },
    { id: 'leaf', position: { x: 20, y: 20 }, parentId: 'inner', data: { label: 'Leaf', shape: 'circle' } },
  ]

  const output = serialize(nodes as any, [])

  assert.ok(output.indexOf('subgraph outer') < output.indexOf('subgraph inner'))
  assert.ok(output.includes('direction TB'))
  assert.ok(output.includes('direction LR'))
  assert.ok(output.includes('leaf(("Leaf"))'))
})
