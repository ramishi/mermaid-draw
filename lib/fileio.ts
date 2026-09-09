import type { Edge, Node } from '@xyflow/react'
import {
  DEFAULT_EDITOR_SETTINGS,
  type EditorSettings,
  type FlowEdgeData,
  type FlowNodeData,
} from './store.ts'
import { serialize, type SerializeOptions } from './serializer.ts'

export const CURRENT_DOCUMENT_VERSION = 2 as const

export interface DiagramDocument {
  version: typeof CURRENT_DOCUMENT_VERSION
  name?: string
  nodes: Node<FlowNodeData>[]
  edges: Edge<FlowEdgeData>[]
  settings: EditorSettings
}

/** Trigger a browser file download with given content */
function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeFilename(name: string): string {
  return name.trim().replace(/[^a-z0-9_\-. ]/gi, '').replace(/\s+/g, '_') || 'diagram'
}

export function downloadMmd(
  nodes: Node<FlowNodeData>[],
  edges: Edge<FlowEdgeData>[],
  options?: SerializeOptions,
  name?: string,
) {
  const base = name ? safeFilename(name) : 'diagram'
  download(`${base}.mmd`, serialize(nodes, edges, options), 'text/plain')
}

export function createDiagramDocument(
  nodes: Node<FlowNodeData>[],
  edges: Edge<FlowEdgeData>[],
  settings: EditorSettings,
  name?: string,
): DiagramDocument {
  return {
    version: CURRENT_DOCUMENT_VERSION,
    ...(name !== undefined ? { name } : {}),
    nodes,
    edges,
    settings: { ...settings },
  }
}

export function saveDiagramJson(
  nodes: Node<FlowNodeData>[],
  edges: Edge<FlowEdgeData>[],
  settings: EditorSettings,
  name?: string,
) {
  const base = name ? safeFilename(name) : 'diagram'
  const payload = JSON.stringify(createDiagramDocument(nodes, edges, settings, name), null, 2)
  download(`${base}.diagram.json`, payload, 'application/json')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNode(value: unknown): value is Node<FlowNodeData> {
  if (!isRecord(value) || typeof value.id !== 'string' || !isRecord(value.position)) return false
  if (typeof value.position.x !== 'number' || typeof value.position.y !== 'number') return false
  return isRecord(value.data) && typeof value.data.label === 'string' && typeof value.data.shape === 'string'
}

function isEdge(value: unknown): value is Edge<FlowEdgeData> {
  return isRecord(value) && typeof value.id === 'string' && typeof value.source === 'string' && typeof value.target === 'string'
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T)
}

function parseSettings(value: unknown): EditorSettings {
  if (!isRecord(value)) throw new Error('Invalid diagram settings')
  if (!isOneOf(value.direction, ['TD', 'LR', 'BT', 'RL'])) throw new Error('Invalid diagram settings')
  if (!isOneOf(value.theme, ['default', 'dark', 'forest', 'neutral', 'base'])) throw new Error('Invalid diagram settings')
  if (!isOneOf(value.look, ['classic', 'handDrawn'])) throw new Error('Invalid diagram settings')
  if (!isOneOf(value.curveStyle, ['basis', 'bumpX', 'bumpY', 'cardinal', 'catmullRom', 'linear', 'monotoneX', 'monotoneY', 'natural', 'step', 'stepAfter', 'stepBefore'])) throw new Error('Invalid diagram settings')
  if (!isOneOf(value.layoutEngine, ['dagre', 'elk'])) throw new Error('Invalid diagram settings')
  if (typeof value.nodeSpacing !== 'number' || !Number.isFinite(value.nodeSpacing) || value.nodeSpacing < 0) throw new Error('Invalid diagram settings')
  if (value.layoutPadding !== undefined && (typeof value.layoutPadding !== 'number' || !Number.isFinite(value.layoutPadding) || value.layoutPadding < 0 || value.layoutPadding > 200)) throw new Error('Invalid diagram settings')
  const layoutPadding = value.layoutPadding === undefined ? DEFAULT_EDITOR_SETTINGS.layoutPadding : value.layoutPadding
  if (typeof value.gridVisible !== 'boolean' || typeof value.snapToGrid !== 'boolean') throw new Error('Invalid diagram settings')
  if (typeof value.gridSize !== 'number' || !Number.isFinite(value.gridSize) || value.gridSize < 4 || value.gridSize > 64) throw new Error('Invalid diagram settings')
  const defaultEdgeRouting = isOneOf(value.defaultEdgeRouting, ['bezier', 'smoothstep', 'step', 'straight'] as const)
    ? value.defaultEdgeRouting
    : DEFAULT_EDITOR_SETTINGS.defaultEdgeRouting
  const defaultEdgeAnimated = typeof value.defaultEdgeAnimated === 'boolean'
    ? value.defaultEdgeAnimated
    : DEFAULT_EDITOR_SETTINGS.defaultEdgeAnimated
  const renderNodeHtml = typeof value.renderNodeHtml === 'boolean'
    ? value.renderNodeHtml
    : DEFAULT_EDITOR_SETTINGS.renderNodeHtml
  return {
    direction: value.direction,
    theme: value.theme,
    look: value.look,
    curveStyle: value.curveStyle,
    layoutEngine: value.layoutEngine,
    nodeSpacing: value.nodeSpacing,
    rankSpacing: value.rankSpacing,
    layoutPadding,
    gridVisible: value.gridVisible,
    snapToGrid: value.snapToGrid,
    gridSize: value.gridSize,
    defaultEdgeRouting,
    defaultEdgeAnimated,
    renderNodeHtml,
  } as EditorSettings
}

export function parseDiagramDocument(value: unknown): DiagramDocument {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    throw new Error('Invalid diagram file')
  }
  if (!value.nodes.every(isNode) || !value.edges.every(isEdge)) throw new Error('Invalid diagram file')

  const name = typeof value.name === 'string' ? value.name : undefined
  if (value.version === undefined || value.version === 1) {
    return createDiagramDocument(value.nodes, value.edges, { ...DEFAULT_EDITOR_SETTINGS }, name)
  }
  if (value.version !== CURRENT_DOCUMENT_VERSION) throw new Error('Unsupported diagram file version')

  return createDiagramDocument(value.nodes, value.edges, parseSettings(value.settings), name)
}

export function loadDiagramJson(): Promise<DiagramDocument> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.diagram.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('No file selected'))
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          resolve(parseDiagramDocument(JSON.parse(e.target?.result as string)))
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
