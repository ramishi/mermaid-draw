import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js'
import type { Edge, Node } from '@xyflow/react'
import type { Direction, FlowNodeData } from './store.ts'

const NODE_WIDTH = 150
const NODE_HEIGHT = 60

const ELK_DIRECTION: Record<Direction, string> = {
  TD: 'DOWN',
  LR: 'RIGHT',
  BT: 'UP',
  RL: 'LEFT',
}

function dimension(node: Node<FlowNodeData>, key: 'width' | 'height', fallback: number) {
  const measured = node.measured?.[key]
  if (typeof measured === 'number' && measured > 0) return measured
  const styled = node.style?.[key]
  return typeof styled === 'number' && styled > 0 ? styled : fallback
}

export interface ElkLayoutOptions {
  nodeSpacing?: number
  rankSpacing?: number
  layoutPadding?: number
}

/** Layout a flat React Flow graph with ELK's layered algorithm. */
export async function applyElkLayout(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  direction: Direction = 'TD',
  options: ElkLayoutOptions = {},
): Promise<Node<FlowNodeData>[]> {
  const elk = new ELK()
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': ELK_DIRECTION[direction],
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': String(options.nodeSpacing ?? 60),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(options.rankSpacing ?? 80),
      'elk.padding': `[top=${options.layoutPadding ?? 40},left=${options.layoutPadding ?? 40},bottom=${options.layoutPadding ?? 40},right=${options.layoutPadding ?? 40}]`,
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: dimension(node, 'width', NODE_WIDTH),
      height: dimension(node, 'height', NODE_HEIGHT),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }

  const laidOut = await elk.layout(graph)
  const positions = new Map((laidOut.children ?? []).map((node) => [node.id, node]))

  return nodes.map((node) => {
    const position = positions.get(node.id)
    if (!position) return node
    return {
      ...node,
      position: {
        x: position.x ?? node.position.x,
        y: position.y ?? node.position.y,
      },
    }
  })
}
