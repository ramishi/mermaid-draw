import type { Edge, Node } from '@xyflow/react'
import type {
  ArrowType,
  CurveStyle,
  Direction,
  EdgeStyle,
  FlowEdgeData,
  FlowNodeData,
  Look,
  NodeShape,
  Theme,
} from './store'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_')
}

function escapeLabel(label: string): string {
  return label.replace(/"/g, "'")
}

const SHAPE_TEMPLATES: Record<NodeShape, [string, string]> = {
  'rounded': ['("', '")'],
  'stadium': ['(["', '"])'],
  'subroutine': ['[["', '"]]'],
  'cylinder': ['[("', '")]'],
  'circle': ['(("', '"))'],
  'double-circle': ['((("', '")))'],
  'diamond': ['{"', '"}'],
  'hexagon': ['{{"', '"}}'],
  'parallelogram': ['[/"', '"/]'],
  'parallelogram-alt': ['[\\"', '"\\]'],
  'trapezoid': ['[/"', '"\\]'],
  'trapezoid-alt': ['[\\"', '"/]'],
  'asymmetric': ['>"', '"]'],
  'rectangle': ['["', '"]'],
}

/** Wrap a label in the correct Mermaid shape syntax for all 14 shapes */
function shapeWrap(id: string, label: string, shape: NodeShape): string {
  const sid = sanitizeId(id)
  const lbl = escapeLabel(label)
  const [open, close] = SHAPE_TEMPLATES[shape] ?? SHAPE_TEMPLATES['rectangle']

  return `${sid}${open}${lbl}${close}`
}

/** Build the Mermaid edge connector string based on style and arrow type */
function edgeConnector(edgeStyle: EdgeStyle, arrowType: ArrowType): string {
  if (edgeStyle === 'dashed') {
    switch (arrowType) {
      case 'none':          return '-.-'
      case 'bidirectional': return '<-.->'
      case 'circle':        return '-.-o'
      case 'cross':         return '-.-x'
      default:              return '-.->'
    }
  }
  if (edgeStyle === 'thick') {
    switch (arrowType) {
      case 'none':          return '==='
      case 'bidirectional': return '<===>'
      default:              return '==>'
    }
  }
  // solid (default)
  switch (arrowType) {
    case 'none':          return '---'
    case 'bidirectional': return '<-->'
    case 'circle':        return '--o'
    case 'cross':         return '--x'
    default:              return '-->'
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SerializeOptions {
  direction?: Direction
  /** @deprecated — no longer affects canvas; ignored by serializer */
  theme?: Theme
  /** @deprecated — no longer affects canvas; ignored by serializer */
  look?: Look
  /** @deprecated — use defaultEdgeRouting instead */
  curveStyle?: CurveStyle
  defaultEdgeRouting?: 'bezier' | 'straight' | 'step' | 'smoothstep'
}

// Map ReactFlow edge routing to the closest Mermaid flowchart curve type
const ROUTING_TO_CURVE: Record<string, CurveStyle> = {
  bezier:     'basis',
  straight:   'linear',
  step:       'stepBefore',
  smoothstep: 'cardinal',
}

export function serialize(
  nodes: Node<FlowNodeData>[],
  edges: Edge<FlowEdgeData>[],
  options: SerializeOptions = {}
): string {
  const { direction = 'TD', defaultEdgeRouting = 'bezier' } = options

  if (nodes.length === 0) {
    return `flowchart TD\n  %% Add nodes to get started`
  }

  const lines: string[] = []

  // ── Frontmatter: only emit curve when it differs from Mermaid's default (basis) ──
  const curve = ROUTING_TO_CURVE[defaultEdgeRouting] ?? 'basis'
  if (curve !== 'basis') {
    lines.push(`%%{ init: ${JSON.stringify({ flowchart: { curve } })} }%%`)
  }

  // ── Graph header ──────────────────────────────────────────────────────────
  lines.push(`flowchart ${direction}`)

  // ── Separate node categories ──────────────────────────────────────────────
  const subgraphNodes = nodes.filter((node) => node.data.isSubgraph)
  const standaloneNodes = nodes.filter((node) => !node.data.isSubgraph && !node.parentId)
  const childrenByParent = new Map<string, typeof nodes>()
  for (const node of nodes) {
    if (!node.parentId) continue
    const children = childrenByParent.get(node.parentId) ?? []
    children.push(node)
    childrenByParent.set(node.parentId, children)
  }

  // ── Standalone node declarations ──────────────────────────────────────────
  for (const node of standaloneNodes) {
    const shape = (node.data.shape ?? 'rectangle') as NodeShape
    const label = node.data.label || node.id
    lines.push(`  ${shapeWrap(node.id, label, shape)}`)
  }

  const writeSubgraph = (subgraph: (typeof nodes)[number], indent: string) => {
    const sgId = sanitizeId(subgraph.id)
    const sgLabel = escapeLabel(subgraph.data.label || subgraph.id)
    lines.push(`${indent}subgraph ${sgId} ["${sgLabel}"]`)
    if (subgraph.data.subgraphDirection) lines.push(`${indent}  direction ${subgraph.data.subgraphDirection}`)
    for (const child of childrenByParent.get(subgraph.id) ?? []) {
      if (child.data.isSubgraph) {
        writeSubgraph(child, `${indent}  `)
      } else {
        const shape = (child.data.shape ?? 'rectangle') as NodeShape
        const label = child.data.label || child.id
        lines.push(`${indent}  ${shapeWrap(child.id, label, shape)}`)
      }
    }
    lines.push(`${indent}end`)
  }

  // ── Subgraph blocks ───────────────────────────────────────────────────────
  for (const subgraph of subgraphNodes.filter((node) => !node.parentId)) {
    writeSubgraph(subgraph, '  ')
  }

  // ── Node and subgraph styles (only for custom-coloured elements) ───────────
  for (const node of nodes) {
    const parts: string[] = []
    if (node.data.fillColor) parts.push(`fill:${node.data.fillColor}`)
    if (node.data.strokeColor) parts.push(`stroke:${node.data.strokeColor}`)
    if (node.data.textColor) parts.push(`color:${node.data.textColor}`)
    if (parts.length > 0) {
      lines.push(`  style ${sanitizeId(node.id)} ${parts.join(',')}`)
    }
  }

  // ── Edge declarations ─────────────────────────────────────────────────────
  for (const edge of edges) {
    const src = sanitizeId(edge.source)
    const tgt = sanitizeId(edge.target)
    const label = typeof edge.label === 'string' ? edge.label : undefined
    const edgeStyle = (edge.data?.edgeStyle as EdgeStyle) ?? 'solid'
    const arrowType = (edge.data?.arrowType as ArrowType) ?? 'arrow'
    const connector = edgeConnector(edgeStyle, arrowType)

    if (label?.trim()) {
      lines.push(`  ${src} ${connector}|"${escapeLabel(label)}"| ${tgt}`)
    } else {
      lines.push(`  ${src} ${connector} ${tgt}`)
    }
  }

  // ── Edge custom colours (linkStyle by index) ──────────────────────────────
  edges.forEach((edge, i) => {
    const strokeColor = edge.data?.strokeColor as string | undefined
    if (strokeColor) {
      lines.push(`  linkStyle ${i} stroke:${strokeColor}`)
    }
  })

  return lines.join('\n')
}
