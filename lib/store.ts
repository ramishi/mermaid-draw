import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeMarkerType,
  type Node,
  type NodeChange,
} from "@xyflow/react";

// ─── Node shape types ────────────────────────────────────────────────────────
export type NodeShape =
  | "rectangle"
  | "rounded"
  | "stadium"
  | "subroutine"
  | "cylinder"
  | "circle"
  | "double-circle"
  | "diamond"
  | "hexagon"
  | "parallelogram"
  | "parallelogram-alt"
  | "trapezoid"
  | "trapezoid-alt"
  | "asymmetric";

// ─── Edge style types ─────────────────────────────────────────────────────────
export type EdgeStyle = "solid" | "dashed" | "thick";
export type ArrowType = "arrow" | "none" | "bidirectional" | "circle" | "cross";

// ─── Diagram-level settings ───────────────────────────────────────────────────
export type Direction = "TD" | "LR" | "BT" | "RL";
export type Theme = "default" | "dark" | "forest" | "neutral" | "base";
export type Look = "classic" | "handDrawn";
export type CurveStyle =
  | "basis"
  | "bumpX"
  | "bumpY"
  | "cardinal"
  | "catmullRom"
  | "linear"
  | "monotoneX"
  | "monotoneY"
  | "natural"
  | "step"
  | "stepAfter"
  | "stepBefore";

// ─── Data types ───────────────────────────────────────────────────────────────
export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  shape: NodeShape;
  fillColor?: string;
  strokeColor?: string;
  textColor?: string;
  collapsed?: boolean
  subgraphDirection?: Direction
}

export interface FlowEdgeData extends Record<string, unknown> {
  edgeStyle?: EdgeStyle;
  arrowType?: ArrowType;
  strokeColor?: string;
  routing?: EdgeRouting;
  strokeWidth?: number;
  strokeDasharray?: string;
  animated?: boolean;
}

export type EdgeRouting = "bezier" | "straight" | "step" | "smoothstep";

export interface EditorSettings {
  direction: Direction;
  theme: Theme;
  look: Look;
  curveStyle: CurveStyle;
  layoutEngine: "dagre" | "elk";
  nodeSpacing: number;
  rankSpacing: number;
  layoutPadding: number;
  gridVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;
  defaultEdgeRouting: EdgeRouting;
  defaultEdgeAnimated: boolean;
  renderNodeHtml: boolean;

}
// ─── History snapshot ─────────────────────────────────────────────────────────
type Snapshot = {
  nodes: Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
};

const MAX_HISTORY = 50;
let nodeCounter = 1;

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  direction: "TD",
  theme: "default",
  look: "classic",
  curveStyle: "basis",
  layoutEngine: "elk",
  nodeSpacing: 60,
  rankSpacing: 80,
  layoutPadding: 40,
  gridVisible: true,
  snapToGrid: true,
  gridSize: 20,
  defaultEdgeRouting: "smoothstep",
  defaultEdgeAnimated: true,
  renderNodeHtml: true,
};

// ─── Store interface ──────────────────────────────────────────────────────────
interface FlowState {
  nodes: Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
  direction: Direction;
  theme: Theme;
  look: Look;
  curveStyle: CurveStyle;
  layoutEngine: "dagre" | "elk";
  nodeSpacing: number;
  rankSpacing: number;
  layoutPadding: number;
  gridVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;
  defaultEdgeRouting: EdgeRouting;
  defaultEdgeAnimated: boolean;
  renderNodeHtml: boolean;
  past: Snapshot[];
  future: Snapshot[];

  // React Flow change handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Node operations
  addNode: (shape?: NodeShape) => void;
  addNodeAtPosition: (
    position: { x: number; y: number },
    shape?: NodeShape,
    width?: number,
    height?: number,
  ) => void;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeShape: (id: string, shape: NodeShape) => void;
  updateNodeStyle: (
    id: string,
    style: Partial<
      Pick<FlowNodeData, "fillColor" | "strokeColor" | "textColor">
    >,
  ) => void;
  setNodes: (nodes: Node<FlowNodeData>[]) => void;
  loadDiagram: (
    nodes: Node<FlowNodeData>[],
    edges: Edge<FlowEdgeData>[],
    settings?: Partial<EditorSettings>,
    name?: string,
  ) => void;
  importDiagram: (
    nodes: Node<FlowNodeData>[],
    edges: Edge<FlowEdgeData>[],
    settings: { direction: Direction; theme: Theme; look: Look; curveStyle: CurveStyle },
  ) => void;

  // Subgraph operations
  addSubgraph: (title?: string) => void;
  assignToSubgraph: (nodeIds: string[], subgraphId: string | null) => void;
  toggleSubgraph: (id: string) => void
  updateSubgraphDirection: (id: string, direction: Direction) => void

  // Edge operations
  updateEdgeLabel: (id: string, label: string) => void;
  updateEdgeType: (id: string, updates: Partial<FlowEdgeData>) => void;

  // Diagram settings
  setDirection: (direction: Direction) => void;
  setTheme: (theme: Theme) => void;
  setLook: (look: Look) => void;
  setCurveStyle: (curveStyle: CurveStyle) => void;
  setNodeSpacing: (spacing: number) => void;
  setRankSpacing: (spacing: number) => void;
  setLayoutEngine: (engine: "dagre" | "elk") => void;
  setGridVisible: (visible: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setLayoutPadding: (padding: number) => void;
  setGridSize: (size: number) => void;
  setDefaultEdgeRouting: (routing: EdgeRouting) => void;
  setDefaultEdgeAnimated: (animated: boolean) => void;
  setRenderNodeHtml: (enabled: boolean) => void;

  // Selection operations
  alignSelected: (axis: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distributeSelected: (axis: "horizontal" | "vertical") => void;
  // Context menu operations
  deleteSelected: () => void
  groupSelected: () => void
  bringToFront: () => void

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Selection operations
  duplicateSelected: () => void;
  clipboard: { nodes: Node<FlowNodeData>[]; edges: Edge<FlowEdgeData>[] } | null;
  copySelected: () => void;
  pasteClipboard: () => void;

  // Draw mode
  drawingShape: NodeShape | null;
  setDrawingShape: (shape: NodeShape | null) => void;

  // Diagram metadata
  diagramName: string;
  setDiagramName: (name: string) => void;
}

// ─── Helper: compute edge markers based on arrowType ─────────────────────────
function computeMarkers(arrowType: ArrowType): {
  markerEnd?: EdgeMarkerType;
  markerStart?: EdgeMarkerType;
} {
  if (arrowType === "none") return {};
  if (arrowType === "bidirectional") {
    return {
      markerEnd: { type: MarkerType.ArrowClosed },
      markerStart: { type: MarkerType.ArrowClosed },
    };
  }
  return { markerEnd: { type: MarkerType.ArrowClosed } };
}

function nodeSize(node: Node<FlowNodeData>, dimension: "width" | "height", fallback: number) {
  const measured = node.measured?.[dimension]
  if (typeof measured === "number" && measured > 0) return measured
  const styled = node.style?.[dimension]
  return typeof styled === "number" && styled > 0 ? styled : fallback
}

function alignNodes(
  nodes: Node<FlowNodeData>[],
  axis: "left" | "center" | "right" | "top" | "middle" | "bottom",
) {
  const selected = nodes.filter((node) => node.selected)
  if (selected.length < 2) return nodes

  const horizontal = axis === "left" || axis === "center" || axis === "right"
  const edges = selected.map((node) => {
    const width = nodeSize(node, "width", 150)
    const height = nodeSize(node, "height", 60)
    return { node, left: node.position.x, right: node.position.x + width, top: node.position.y, bottom: node.position.y + height }
  })
  const target = axis === "left" ? Math.min(...edges.map((edge) => edge.left))
    : axis === "right" ? Math.max(...edges.map((edge) => edge.right))
      : axis === "top" ? Math.min(...edges.map((edge) => edge.top))
        : axis === "bottom" ? Math.max(...edges.map((edge) => edge.bottom))
          : horizontal
            ? (Math.min(...edges.map((edge) => edge.left)) + Math.max(...edges.map((edge) => edge.right))) / 2
            : (Math.min(...edges.map((edge) => edge.top)) + Math.max(...edges.map((edge) => edge.bottom))) / 2

  return nodes.map((node) => {
    const edge = edges.find((entry) => entry.node.id === node.id)
    if (!edge) return node
    const width = edge.right - edge.left
    const height = edge.bottom - edge.top
    const position = horizontal
      ? { x: axis === "left" ? target : axis === "right" ? target - width : target - width / 2, y: node.position.y }
      : { x: node.position.x, y: axis === "top" ? target : axis === "bottom" ? target - height : target - height / 2 }
    return { ...node, position }
  })
}

function distributeNodes(nodes: Node<FlowNodeData>[], axis: "horizontal" | "vertical") {
  const selected = nodes.filter((node) => node.selected)
  if (selected.length < 3) return nodes
  const sorted = [...selected].sort((a, b) => a.position[axis === "horizontal" ? "x" : "y"] - b.position[axis === "horizontal" ? "x" : "y"])
  const coordinate = axis === "horizontal" ? "x" : "y"
  const start = sorted[0].position[coordinate]
  const end = sorted[sorted.length - 1].position[coordinate]
  const step = (end - start) / (sorted.length - 1)
  const positions = new Map(sorted.map((node, index) => [node.id, start + step * index]))
  return nodes.map((node) => positions.has(node.id) ? { ...node, position: { ...node.position, [coordinate]: positions.get(node.id)! } } : node)
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useFlowStore = create<FlowState>((set, get) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withHistory = <T extends (...args: any[]) => void>(fn: T): T => {
    return ((...args: Parameters<T>) => {
      const { nodes: beforeNodes, edges: beforeEdges } = get();

      fn(...args);

      const { nodes: afterNodes, edges: afterEdges, past } = get();

      if (beforeNodes !== afterNodes || beforeEdges !== afterEdges) {
        const snapshot: Snapshot = {
          nodes: beforeNodes.map((n) => ({ ...n, data: { ...n.data } })),
          edges: beforeEdges.map((e) => ({
            ...e,
            data: { ...(e.data ?? {}) } as FlowEdgeData,
          })),
        };
        set({
          past: [...past.slice(-(MAX_HISTORY - 1)), snapshot],
          future: [],
        });
      }
    }) as T;
  };

  return {
    nodes: [],
    edges: [],
    ...DEFAULT_EDITOR_SETTINGS,
    past: [],
    future: [],
    clipboard: null,
    drawingShape: null,
    setDrawingShape: (shape) => set({ drawingShape: shape }),
    diagramName: 'Untitled diagram',
    setDiagramName: (name) => set({ diagramName: name }),

    pushHistory: () => {
      const { nodes, edges, past } = get();
      const snapshot: Snapshot = {
        nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: edges.map((e) => ({
          ...e,
          data: { ...(e.data ?? {}) } as FlowEdgeData,
        })),
      };
      set({ past: [...past.slice(-(MAX_HISTORY - 1)), snapshot], future: [] });
    },

    undo: () => {
      const { past, nodes, edges, future } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      const current: Snapshot = { nodes, edges };
      set({
        nodes: prev.nodes,
        edges: prev.edges,
        past: past.slice(0, -1),
        future: [current, ...future.slice(0, MAX_HISTORY - 1)],
      });
    },

    redo: () => {
      const { past, nodes, edges, future } = get();
      if (future.length === 0) return;
      const next = future[0];
      const current: Snapshot = { nodes, edges };
      set({
        nodes: next.nodes,
        edges: next.edges,
        past: [...past.slice(-(MAX_HISTORY - 1)), current],
        future: future.slice(1),
      });
    },

    onNodesChange: (changes) =>
      set({
        nodes: applyNodeChanges(changes, get().nodes) as Node<FlowNodeData>[],
      }),

    onEdgesChange: (changes) =>
      set({
        edges: applyEdgeChanges(changes, get().edges) as Edge<FlowEdgeData>[],
      }),

    onConnect: withHistory((connection) => {
      const { defaultEdgeRouting, defaultEdgeAnimated } = get();
      const markers = computeMarkers("arrow");
      set({
        edges: addEdge(
          {
            ...connection,
            type: "flowEdge",
            ...markers,
            data: { edgeStyle: "solid", arrowType: "arrow", routing: defaultEdgeRouting, animated: defaultEdgeAnimated }
          },
          get().edges,
        ) as Edge<FlowEdgeData>[],
      });
    }),

    addNode: withHistory((shape: NodeShape = "rectangle") => {
      const id = `node_${nodeCounter++}`;
      const offset = (nodeCounter * 30) % 200;
      const newNode: Node<FlowNodeData> = {
        id,
        type: "flowNode",
        position: { x: 150 + offset, y: 100 + offset },
        data: { label: "Node", shape },
      };
      set({ nodes: [...get().nodes, newNode] });
    }),

    addNodeAtPosition: withHistory(
      (position, shape: NodeShape = "rectangle", width?: number, height?: number) => {
        const id = `node_${nodeCounter++}`;
        const newNode: Node<FlowNodeData> = {
          id,
          type: "flowNode",
          position,
          data: { label: "Node", shape },
          style: width && height ? { width, height } : { width: 200 },
        };
        set({ nodes: [...get().nodes, newNode] });
      },
    ),

    updateNodeLabel: withHistory((id, label) => {
      set({
        nodes: get().nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, label } } : n,
        ),
      });
    }),

    updateNodeShape: withHistory((id, shape) => {
      set({
        nodes: get().nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, shape } } : n,
        ),
      });
    }),

    updateNodeStyle: withHistory((id, style) => {
      set({
        nodes: get().nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...style } } : n,
        ),
      });
    }),

    updateEdgeLabel: withHistory((id, label) => {
      set({
        edges: get().edges.map((e) => (e.id === id ? { ...e, label } : e)),
      });
    }),

    updateEdgeType: withHistory((id, updates) => {
      const arrowType = updates.arrowType;
      const markerUpdates =
        arrowType !== undefined ? computeMarkers(arrowType) : {};
      set({
        edges: get().edges.map((e) =>
          e.id === id
            ? {
                ...e,
                ...markerUpdates,
                data: { ...(e.data ?? {}), ...updates } as FlowEdgeData,
              }
            : e,
        ),
      });
    }),

    setNodes: withHistory((nodes) => {
      set({ nodes });
    }),

    loadDiagram: withHistory((nodes, edges, settings, name?: string) => {
      const stampedNodes = nodes.map((n) => ({ ...n, type: "flowNode" }));
      const stampedEdges = edges.map((e) => ({
        ...e,
        type: "flowEdge",
      })) as Edge<FlowEdgeData>[];
      set({ nodes: stampedNodes, edges: stampedEdges, ...(settings ?? {}), ...(name !== undefined ? { diagramName: name } : {}) });
    }),

    importDiagram: withHistory((nodes, edges, settings) => {
      const stampedNodes = nodes.map((n) => ({
        ...n,
        type: "flowNode",
        style: n.style ?? (n.data?.isSubgraph ? undefined : { width: 200 }),
      }));
      const { defaultEdgeRouting, defaultEdgeAnimated } = get();
      const stampedEdges = edges.map((e) => ({
        ...e,
        type: "flowEdge",
        data: {
          routing: defaultEdgeRouting,
          animated: defaultEdgeAnimated,
          ...e.data,
        } as FlowEdgeData,
      })) as Edge<FlowEdgeData>[];
      // Advance nodeCounter to avoid ID collisions with imported nodes
      const maxId = stampedNodes.reduce((max, n) => {
        const m = n.id.match(/(\d+)$/)
        return m ? Math.max(max, parseInt(m[1], 10)) : max
      }, 0)
      if (maxId >= nodeCounter) nodeCounter = maxId + 1
      set({
        nodes: stampedNodes,
        edges: stampedEdges,
        direction: settings.direction,
        theme: settings.theme,
        look: settings.look,
        curveStyle: settings.curveStyle,
      });
    }),

    addSubgraph: withHistory((title = "Group") => {
      const id = `sg_${nodeCounter++}`;
      const offset = (nodeCounter * 30) % 200;
      const newNode: Node<FlowNodeData> = {
        id,
        type: "flowNode",
        position: { x: 200 + offset, y: 150 + offset },
        data: { label: title, shape: "rectangle", isSubgraph: true },
        style: { width: 320, height: 220 },
        zIndex: -1,
      };
      const existing = get().nodes;
      // Subgraphs must come before their children in the array for ReactFlow parent-child to work
      set({ nodes: [...existing.filter((n) => n.data.isSubgraph), newNode, ...existing.filter((n) => !n.data.isSubgraph)] });
    }),

    assignToSubgraph: withHistory((nodeIds, subgraphId) => {
      const { nodes } = get();
      const updated = nodes.map((n) => {
        if (!nodeIds.includes(n.id)) return n;
        if (subgraphId === null) {
          // Remove from subgraph: restore absolute position
          const parent = n.parentId ? nodes.find((p) => p.id === n.parentId) : null;
          const absPos = parent
            ? { x: parent.position.x + n.position.x, y: parent.position.y + n.position.y }
            : n.position;
          return { ...n, parentId: undefined, extent: undefined, position: absPos };
        }
        // Assign to subgraph: convert to relative position
        const parent = nodes.find((p) => p.id === subgraphId);
        const relPos = parent
          ? { x: n.position.x - parent.position.x, y: n.position.y - parent.position.y }
          : n.position;
        return { ...n, parentId: subgraphId, extent: 'parent' as const, position: relPos };
      });
      // ReactFlow requires parent nodes to appear before their children in the array
      set({ nodes: [...updated.filter((n) => n.data.isSubgraph), ...updated.filter((n) => !n.data.isSubgraph)] });
    }),
    toggleSubgraph: withHistory((id) => {
      const node = get().nodes.find((candidate) => candidate.id === id && candidate.data.isSubgraph)
      if (!node) return
      set({
        nodes: get().nodes.map((candidate) => candidate.id === id
          ? { ...candidate, data: { ...candidate.data, collapsed: !candidate.data.collapsed } }
          : candidate),
      })
    }),
    updateSubgraphDirection: withHistory((id, direction) => {
      const node = get().nodes.find((candidate) => candidate.id === id && candidate.data.isSubgraph)
      if (!node) return
      set({
        nodes: get().nodes.map((candidate) => candidate.id === id
          ? { ...candidate, data: { ...candidate.data, subgraphDirection: direction } }
          : candidate),
      })
    }),
    deleteSelected: withHistory(() => {
      const { nodes, edges } = get();
      const selectedNodeIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
      const removedNodeIds = new Set(selectedNodeIds);

      for (const node of nodes) {
        if (node.parentId && selectedNodeIds.has(node.parentId)) removedNodeIds.add(node.id);
      }

      const selectedEdgeIds = new Set(edges.filter((edge) => edge.selected).map((edge) => edge.id));
      if (removedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;

      set({
        nodes: nodes.filter((node) => !removedNodeIds.has(node.id)),
        edges: edges.filter((edge) =>
          !selectedEdgeIds.has(edge.id) &&
          !removedNodeIds.has(edge.source) &&
          !removedNodeIds.has(edge.target),
        ),
      });
    }),

    groupSelected: withHistory(() => {
      const { nodes } = get();
      const selected = nodes.filter((node) => node.selected && !node.data.isSubgraph && !node.parentId);
      if (selected.length < 2) return;

      const padding = 40;
      const headerHeight = 36;
      const bounds = selected.reduce(
        (result, node) => {
          const width = nodeSize(node, "width", 150);
          const height = nodeSize(node, "height", 60);
          return {
            left: Math.min(result.left, node.position.x),
            top: Math.min(result.top, node.position.y),
            right: Math.max(result.right, node.position.x + width),
            bottom: Math.max(result.bottom, node.position.y + height),
          };
        },
        { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity },
      );
      const groupPosition = { x: bounds.left - padding, y: bounds.top - headerHeight };
      const groupId = `sg_${nodeCounter++}`;
      const group: Node<FlowNodeData> = {
        id: groupId,
        type: "flowNode",
        position: groupPosition,
        data: { label: "Group", shape: "rectangle", isSubgraph: true },
        style: {
          width: bounds.right - bounds.left + padding * 2,
          height: bounds.bottom - bounds.top + padding + headerHeight,
        },
        selected: true,
        zIndex: -1,
      };
      const selectedIds = new Set(selected.map((node) => node.id));
      const groupedNodes = nodes.map((node) => selectedIds.has(node.id)
        ? {
            ...node,
            parentId: groupId,
            extent: "parent" as const,
            position: { x: node.position.x - groupPosition.x, y: node.position.y - groupPosition.y },
            selected: false,
          }
        : { ...node, selected: false });
      set({ nodes: [group, ...groupedNodes] });
    }),

    bringToFront: withHistory(() => {
      const { nodes } = get();
      const selected = nodes.filter((node) => node.selected);
      if (selected.length === 0) return;
      const highestZ = Math.max(0, ...nodes.map((node) => node.zIndex ?? 0));
      const lowestSelectedZ = Math.min(...selected.map((node) => node.zIndex ?? 0));
      const offset = highestZ - lowestSelectedZ + 1;
      set({
        nodes: nodes.map((node) => node.selected
          ? { ...node, zIndex: (node.zIndex ?? 0) + offset }
          : node),
      });
    }),
    setDirection: (direction) => set({ direction }),
    setTheme: (theme) => set({ theme }),
    setLook: (look) => set({ look }),
    setCurveStyle: (curveStyle) => set({ curveStyle }),
    setNodeSpacing: (nodeSpacing) => set({ nodeSpacing: Math.max(0, nodeSpacing) }),
    setRankSpacing: (rankSpacing) => set({ rankSpacing: Math.max(0, rankSpacing) }),
    setLayoutEngine: (layoutEngine) => set({ layoutEngine }),
    setGridVisible: (gridVisible) => set({ gridVisible }),
    setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
    setLayoutPadding: (layoutPadding) => set({ layoutPadding: Math.max(0, Math.min(200, layoutPadding)) }),
    setGridSize: (gridSize) => set({ gridSize: Math.max(4, Math.min(64, gridSize)) }),
    setDefaultEdgeRouting: (defaultEdgeRouting) => set((state) => ({
      defaultEdgeRouting,
      edges: state.edges.map((e) => ({
        ...e,
        data: { ...(e.data ?? {}), routing: defaultEdgeRouting } as FlowEdgeData,
      })),
    })),
    setDefaultEdgeAnimated: (defaultEdgeAnimated) => set((state) => ({
      defaultEdgeAnimated,
      edges: state.edges.map((e) => ({
        ...e,
        data: { ...(e.data ?? {}), animated: defaultEdgeAnimated } as FlowEdgeData,
      })),
    })),
    setRenderNodeHtml: (renderNodeHtml) => set({ renderNodeHtml }),
    alignSelected: withHistory((axis) => {
      const nodes = get().nodes
      set({ nodes: alignNodes(nodes, axis) })
    }),
    distributeSelected: withHistory((axis) => {
      const nodes = get().nodes
      set({ nodes: distributeNodes(nodes, axis) })
    }),
    copySelected: () => {
      const { nodes, edges } = get();
      const selectedNodes = nodes.filter((n) => n.selected);
      if (selectedNodes.length === 0) return;
      const selectedIds = new Set(selectedNodes.map((n) => n.id));
      const selectedEdges = edges.filter(
        (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
      );
      set({ clipboard: { nodes: selectedNodes, edges: selectedEdges } });
    },

    pasteClipboard: withHistory(() => {
      const { clipboard, nodes, edges } = get();
      if (!clipboard || clipboard.nodes.length === 0) return;

      const idMap = new Map<string, string>();

      const newNodes = clipboard.nodes.map((n) => {
        const newId = `node_${nodeCounter++}`;
        idMap.set(n.id, newId);
        return {
          ...n,
          id: newId,
          selected: true,
          position: { x: n.position.x + 40, y: n.position.y + 40 },
          parentId: n.parentId && idMap.has(n.parentId) ? idMap.get(n.parentId) : undefined,
        };
      });

      const newEdges = clipboard.edges
        .filter((e) => idMap.has(e.source) && idMap.has(e.target))
        .map((e) => ({
          ...e,
          id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          source: idMap.get(e.source)!,
          target: idMap.get(e.target)!,
          selected: true,
        }));

      set({
        nodes: [...nodes.map((n) => ({ ...n, selected: false })), ...newNodes],
        edges: [...edges.map((e) => ({ ...e, selected: false })), ...newEdges],
      });
    }),

    duplicateSelected: withHistory(() => {
      const { nodes, edges } = get();
      const selectedNodes = nodes.filter((n) => n.selected);
      if (selectedNodes.length === 0) return;
      const idMap = new Map<string, string>();

      // Duplicate the selected nodes themselves
      const newNodes = selectedNodes.map((n) => {
        const newId = `node_${nodeCounter++}`;
        idMap.set(n.id, newId);
        const label = n.data.isSubgraph ? `Copy of ${n.data.label}` : n.data.label;
        return {
          ...n,
          id: newId,
          data: { ...n.data, label },
          position: { x: n.position.x + 30, y: n.position.y + 30 },
          selected: true,
        };
      });

      // For each duplicated subgraph, also duplicate its children
      const childNodes: Node<FlowNodeData>[] = [];
      for (const n of selectedNodes) {
        if (!n.data.isSubgraph) continue;
        const newParentId = idMap.get(n.id)!;
        for (const child of nodes.filter((c) => c.parentId === n.id)) {
          const newChildId = `node_${nodeCounter++}`;
          idMap.set(child.id, newChildId);
          childNodes.push({ ...child, id: newChildId, parentId: newParentId, selected: true });
        }
      }

      // Duplicate edges where both endpoints were duplicated
      const newEdges = edges
        .filter((e) => idMap.has(e.source) && idMap.has(e.target))
        .map((e) => ({
          ...e,
          id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          source: idMap.get(e.source)!,
          target: idMap.get(e.target)!,
        }));

      set({
        nodes: [...nodes.map((n) => ({ ...n, selected: false })), ...newNodes, ...childNodes],
        edges: [...edges, ...newEdges],
      });
    }),
  };
});
