/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { loadDiagramJson, parseDiagramDocument, type DiagramDocument } from './fileio.ts'

describe('loadDiagramJson', () => {
  let originalDocument: any
  let originalFileReader: any

  beforeEach(() => {
    originalDocument = global.document
    originalFileReader = global.FileReader
  })

  afterEach(() => {
    global.document = originalDocument
    global.FileReader = originalFileReader
  })

  test('rejects with error for invalid JSON syntax', async () => {
    const mockFile = { text: '{ invalid JSON }' }
    const mockInput = {
      type: '',
      accept: '',
      files: [mockFile],
      click: function() {
        if (this.onchange) {
          this.onchange({} as Event)
        }
      },
      onchange: null as any
    }

    global.document = {
      createElement: (tag: string) => {
        if (tag === 'input') return mockInput
        return {}
      }
    } as any

    global.FileReader = class MockFileReader {
      onload: any = null
      readAsText(file: any) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: file.text } })
          }
        }, 0)
      }
    } as any

    await assert.rejects(
      loadDiagramJson(),
      (err: Error) => err instanceof SyntaxError
    )
  })

  test('rejects with error for valid JSON but missing nodes or edges', async () => {
    const mockFile = { text: '{"wrong": "format"}' }
    const mockInput = {
      type: '',
      accept: '',
      files: [mockFile],
      click: function() {
        if (this.onchange) {
          this.onchange({} as Event)
        }
      },
      onchange: null as any
    }

    global.document = {
      createElement: (tag: string) => {
        if (tag === 'input') return mockInput
        return {}
      }
    } as any

    global.FileReader = class MockFileReader {
      onload: any = null
      readAsText(file: any) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: file.text } })
          }
        }, 0)
      }
    } as any

    await assert.rejects(
      loadDiagramJson(),
      { message: 'Invalid diagram file' }
    )
  })
})

const node = {
  id: 'node_1',
  type: 'flowNode' as const,
  position: { x: 42, y: 24 },
  parentId: 'sg_1',
  data: {
    label: 'Start',
    shape: 'rounded' as const,
    fillColor: '#ffffff',
    strokeColor: '#111111',
    textColor: '#222222',
  },
  style: { width: 220, height: 80 },
}

const edge = {
  id: 'edge_1',
  source: 'node_1',
  target: 'node_2',
  label: 'continue',
  data: { edgeStyle: 'dashed' as const, strokeColor: '#333333', routing: 'smoothstep' as const, animated: true },
}

test('migrates version 1 files with default settings', () => {
  const document = parseDiagramDocument({ version: 1, nodes: [node], edges: [edge] })

  assert.deepStrictEqual(document.nodes, [node])
  assert.deepStrictEqual(document.edges, [edge])
  assert.strictEqual(document.version, 2)
  assert.deepStrictEqual(document.settings, {
    direction: 'TD',
    theme: 'default',
    look: 'classic',
    curveStyle: 'basis',
    layoutEngine: 'elk',
    nodeSpacing: 60,
    rankSpacing: 80,
    layoutPadding: 40,
    gridVisible: true,
    snapToGrid: true,
    gridSize: 20,
    defaultEdgeRouting: 'smoothstep',
    defaultEdgeAnimated: true,
    renderNodeHtml: true,
  })
})

test('preserves version 2 canvas data and settings', () => {
  const source: DiagramDocument = {
    version: 2,
    nodes: [node],
    edges: [edge],
    settings: {
      direction: 'LR',
      theme: 'dark',
      look: 'handDrawn',
      curveStyle: 'linear',
      layoutEngine: 'dagre',
      nodeSpacing: 90,
      rankSpacing: 120,
      layoutPadding: 24,
      gridVisible: false,
      snapToGrid: true,
      gridSize: 16,
      defaultEdgeRouting: 'bezier',
      defaultEdgeAnimated: false,
      renderNodeHtml: false,
    }
  }

  assert.deepStrictEqual(parseDiagramDocument(source), source)
})

test('rejects unsupported document versions and invalid settings', () => {
  assert.throws(
    () => parseDiagramDocument({ version: 3, nodes: [], edges: [] }),
    { message: 'Unsupported diagram file version' },
  )
  assert.throws(
    () => parseDiagramDocument({ version: 2, nodes: [], edges: [], settings: {} }),
    { message: 'Invalid diagram settings' },
  )
})
