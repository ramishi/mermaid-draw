import assert from 'node:assert'
import test from 'node:test'
import { useFlowStore, type FlowEdgeData, type FlowNodeData } from './store.ts'
import type { Edge, Node } from '@xyflow/react'

test('useFlowStore withHistory', () => {
  const store = useFlowStore.getState()

  // Initially, history should be empty
  assert.strictEqual(store.past.length, 0)
  assert.strictEqual(store.nodes.length, 0)

  // Trigger an action that should push history
  store.addNode('rectangle')

  const newState = useFlowStore.getState()

  // Past should now contain 1 entry (the initial empty state)
  assert.strictEqual(newState.past.length, 1)
  assert.strictEqual(newState.past[0].nodes.length, 0)
  assert.strictEqual(newState.nodes.length, 1)
  assert.strictEqual(newState.nodes[0].data.shape, 'rectangle')

  // Add another node
  newState.addNode('circle')
  const newestState = useFlowStore.getState()

  assert.strictEqual(newestState.past.length, 2)
  assert.strictEqual(newestState.past[1].nodes.length, 1)
  assert.strictEqual(newestState.nodes.length, 2)

  // Undo
  newestState.undo()
  const undoneState = useFlowStore.getState()

  assert.strictEqual(undoneState.nodes.length, 1)
  assert.strictEqual(undoneState.past.length, 1)
  assert.strictEqual(undoneState.future.length, 1)

  // Redo
  undoneState.redo()
  const redoneState = useFlowStore.getState()

  assert.strictEqual(redoneState.nodes.length, 2)
  assert.strictEqual(redoneState.past.length, 2)
  assert.strictEqual(redoneState.future.length, 0)
})

test('useFlowStore withHistory - no change', () => {
  // Clear the state
  useFlowStore.setState({ nodes: [], edges: [], past: [], future: [] })
  const store = useFlowStore.getState()

  // duplicateSelected with nothing selected should return early
  // and NOT push history
  store.duplicateSelected()

  const newState = useFlowStore.getState()
  assert.strictEqual(newState.past.length, 0)
  assert.strictEqual(newState.nodes.length, 0)
})

test('aligns and distributes selected nodes', () => {
  useFlowStore.setState({
    nodes: [
      { id: 'a', position: { x: 20, y: 10 }, data: { label: 'A', shape: 'rectangle' }, selected: true },
      { id: 'b', position: { x: 140, y: 80 }, data: { label: 'B', shape: 'rectangle' }, selected: true },
      { id: 'c', position: { x: 300, y: 140 }, data: { label: 'C', shape: 'rectangle' }, selected: true },
    ] as Node<FlowNodeData>[], 
    edges: [],
    past: [],
    future: [],
  })

  useFlowStore.getState().alignSelected('top')
  const aligned = useFlowStore.getState().nodes
  assert.deepStrictEqual(aligned.map((node) => node.position.y), [10, 10, 10])

  useFlowStore.getState().distributeSelected('horizontal')
  const distributed = useFlowStore.getState().nodes
  assert.deepStrictEqual(distributed.map((node) => node.position.x), [20, 160, 300])
})

test('context actions group, bring to front, and delete selections', () => {
  useFlowStore.setState({
    nodes: [
      { id: 'a', position: { x: 20, y: 10 }, data: { label: 'A', shape: 'rectangle' }, selected: true, zIndex: 0 },
      { id: 'b', position: { x: 220, y: 90 }, data: { label: 'B', shape: 'rectangle' }, selected: true, zIndex: 1 },
    ] as Node<FlowNodeData>[],
    edges: [{ id: 'e', source: 'a', target: 'b', selected: false }] as Edge<FlowEdgeData>[], 
    past: [],
    future: [],
  })
  useFlowStore.getState().groupSelected()
  const grouped = useFlowStore.getState().nodes
  const group = grouped.find((node) => node.data.isSubgraph)
  assert.ok(group)
  assert.deepStrictEqual(grouped.filter((node) => node.parentId === group.id).map((node) => node.id), ['a', 'b'])
  assert.ok((group.style?.width as number) >= 390)

  useFlowStore.getState().toggleSubgraph(group.id)
  assert.strictEqual(useFlowStore.getState().nodes.find((node) => node.id === group.id)?.data.collapsed, true)
  useFlowStore.getState().undo()
  assert.strictEqual(useFlowStore.getState().nodes.find((node) => node.id === group.id)?.data.collapsed, undefined)
  useFlowStore.getState().redo()
  assert.strictEqual(useFlowStore.getState().nodes.find((node) => node.id === group.id)?.data.collapsed, true)

  useFlowStore.getState().bringToFront()
  assert.ok((useFlowStore.getState().nodes.find((node) => node.id === group.id)?.zIndex ?? 0) > 1)

  useFlowStore.getState().deleteSelected()
  assert.strictEqual(useFlowStore.getState().nodes.length, 0)
  assert.strictEqual(useFlowStore.getState().edges.length, 0)
})
