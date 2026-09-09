import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import type { Direction, FlowNodeData } from './store.ts'
import { applyElkLayout } from './elk-layout.ts'

const NODE_WIDTH = 150
const NODE_HEIGHT = 60
const SUBGRAPH_PADDING = 40

export interface LayoutOptions {
  nodeSpacing?: number
  rankSpacing?: number
  layoutEngine?: 'dagre' | 'elk'
  layoutPadding?: number
}

const RANKDIR: Record<Direction, string> = {
  TD: 'TB',
  LR: 'LR',
  BT: 'BT',
  RL: 'RL',
}

export function applyDagreLayout(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  direction: Direction = 'TD',
  options: LayoutOptions = {},
): Node<FlowNodeData>[] {
  if (nodes.length === 0) return nodes

  const nodeSpacing = options.nodeSpacing ?? 60
  const rankSpacing = options.rankSpacing ?? 80

  const getDimension = (node: Node<FlowNodeData>, dimension: 'width' | 'height', fallback: number) => {
    const measured = node.measured?.[dimension]
    if (typeof measured === 'number' && measured > 0) return measured
    const styled = node.style?.[dimension]
    return typeof styled === 'number' && styled > 0 ? styled : fallback
  }

  const g = new dagre.graphlib.Graph({ compound: true })
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: RANKDIR[direction], nodesep: nodeSpacing, ranksep: rankSpacing, marginx: options.layoutPadding ?? 40, marginy: options.layoutPadding ?? 40 })

  // Add all nodes
  for (const node of nodes) {
    if (node.data?.isSubgraph) {
      // Let dagre auto-size subgraphs from children; provide padding
      g.setNode(node.id, {
        width: 0,
        height: 0,
        paddingX: SUBGRAPH_PADDING,
        paddingY: SUBGRAPH_PADDING,
      })
    } else {
      const w = getDimension(node, 'width', NODE_WIDTH)
      const h = getDimension(node, 'height', NODE_HEIGHT)
      g.setNode(node.id, { width: w, height: h })
    }
  }

  // Set parent relationships for compound layout
  for (const node of nodes) {
    if (node.parentId) {
      g.setParent(node.id, node.parentId)
    }
  }

  // Add ALL edges — dagre handles cross-boundary edges in compound mode
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const layout = g.node(node.id)
    if (!layout) return node

    if (node.data?.isSubgraph) {
      return {
        ...node,
        position: {
          x: layout.x - layout.width / 2,
          y: layout.y - layout.height / 2,
        },
        style: {
          ...node.style,
          width: layout.width,
          height: layout.height,
        },
      }
    }

    if (node.parentId) {
      // Convert dagre absolute coords to parent-relative for React Flow
      const parentLayout = g.node(node.parentId)
      if (!parentLayout) return node
      const w = getDimension(node, 'width', NODE_WIDTH)
      const h = getDimension(node, 'height', NODE_HEIGHT)
      const parentTopLeftX = parentLayout.x - parentLayout.width / 2
      const parentTopLeftY = parentLayout.y - parentLayout.height / 2
      return {
        ...node,
        position: {
          x: layout.x - w / 2 - parentTopLeftX,
          y: layout.y - h / 2 - parentTopLeftY,
        },
      }
    }

    // Top-level non-subgraph node
    const w = getDimension(node, 'width', NODE_WIDTH)
    const h = getDimension(node, 'height', NODE_HEIGHT)
    return {
      ...node,
      position: {
        x: layout.x - w / 2,
        y: layout.y - h / 2,
      },
    }
  })
}

export async function applyLayout(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  direction: Direction = 'TD',
  options: LayoutOptions = {},
): Promise<Node<FlowNodeData>[]> {
  if (options.layoutEngine !== 'elk' || nodes.some((node) => node.parentId || node.data.isSubgraph)) {
    return applyDagreLayout(nodes, edges, direction, options)
  }

  try {
    return await applyElkLayout(nodes, edges, direction, options)
  } catch {
    return applyDagreLayout(nodes, edges, direction, options)
  }
}
