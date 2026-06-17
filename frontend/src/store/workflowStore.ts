"use client";

import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import { create } from "zustand";

const generateId = () =>
  `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export type WorkflowMeta = {
  id: string | number;
  name: string;
  status: string;
};

type HistoryEntry = {
  nodes: Node[];
  edges: Edge[];
};

export type ExecutionStatus = "idle" | "pending" | "running" | "completed" | "failed";

export interface StepExecutionStatus {
  stepId: string | number;
  status: ExecutionStatus;
  output?: Record<string, unknown>;
  error?: string;
}

export type WorkflowState = {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  workflowMeta: WorkflowMeta | null;
  isDirty: boolean;
  isSaving: boolean;

  // Undo/Redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistory: number;

  // Execution visualization
  executionStatus: StepExecutionStatus[];
  executionId: string | number | null;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: string, position: { x: number; y: number }, label?: string) => Node;
  removeNode: (id: string) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (id: string, label: string) => void;
  setSelectedNode: (node: Node | null) => void;
  clearSelection: () => void;
  loadWorkflow: (meta: WorkflowMeta) => void;
  loadNodes: (nodes: Node[]) => void;
  loadEdges: (edges: Edge[]) => void;
  setWorkflowMeta: (meta: Partial<WorkflowMeta>) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Execution
  setExecutionStatus: (status: StepExecutionStatus[]) => void;
  setExecutionId: (id: string | number | null) => void;
  updateStepExecutionStatus: (stepId: string | number, status: ExecutionStatus, output?: Record<string, unknown>, error?: string) => void;
  clearExecutionStatus: () => void;
};

const typeToNodeType: Record<string, string> = {
  trigger: "trigger",
  webhook: "trigger",
  schedule: "trigger",
  action: "action",
  condition: "condition",
  delay: "delay",
  http_request: "http_request",
  email_send: "email",
  email: "email",
  transform: "transform",
  code: "transform",
  discord_message: "action",
  telegram_message: "action",
  slack_message: "action",
  loop: "action",
  ai_prompt: "action",
  database_query: "action",
  sub_workflow: "action",
};

function createDefaultConfig(stepType: string): Record<string, unknown> {
  switch (stepType) {
    case "trigger":
    case "webhook":
      return { webhook_url: "" };
    case "http_request":
      return { method: "GET", url: "", headers: [], body: "" };
    case "condition":
      return { field: "", operator: "==", value: "" };
    case "delay":
      return { delay_seconds: 60 };
    case "email_send":
    case "email":
      return { to: "", subject: "", body: "" };
    default:
      return {};
  }
}

function pushHistory(state: WorkflowState): Partial<WorkflowState> {
  const entry: HistoryEntry = {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    edges: JSON.parse(JSON.stringify(state.edges)),
  };
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);
  if (newHistory.length > state.maxHistory) {
    newHistory.shift();
  }
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflowMeta: null,
  isDirty: false,
  isSaving: false,

  // Undo/Redo
  history: [],
  historyIndex: -1,
  maxHistory: 50,

  // Execution
  executionStatus: [],
  executionId: null,

  setNodes: (nodes) => set({ nodes, ...pushHistory(get()) }),

  setEdges: (edges) => set({ edges, ...pushHistory(get()) }),

  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: newNodes, ...pushHistory(get()) });
  },

  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: newEdges, ...pushHistory(get()) });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, type: "dataflow" }, get().edges),
      isDirty: true,
      ...pushHistory(get()),
    });
  },

  addNode: (type, position, label) => {
    const nodeType = typeToNodeType[type] || "action";
    const newId = generateId();
    const newNode: Node = {
      id: newId,
      type: nodeType,
      position,
      data: {
        label: label || type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
        stepType: type,
        config: createDefaultConfig(type),
        executionStatus: undefined,
      },
    };
    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
      ...pushHistory(get()),
    });
    return newNode;
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNode: get().selectedNode?.id === id ? null : get().selectedNode,
      isDirty: true,
      ...pushHistory(get()),
    });
  },

  updateNodeConfig: (id, config) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, config: { ...(n.data.config as Record<string, unknown>), ...config } } }
          : n
      ),
      isDirty: true,
      ...pushHistory(get()),
    });
  },

  updateNodeLabel: (id, label) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      ),
      isDirty: true,
      ...pushHistory(get()),
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),
  clearSelection: () => set({ selectedNode: null }),

  loadWorkflow: (meta) => set({ workflowMeta: meta }),
  loadNodes: (nodes) => set({
    nodes,
    history: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: [] }],
    historyIndex: 0,
  }),
  loadEdges: (edges) =>
    set({
      edges: edges.map((e) => ({ ...e, type: e.type || "dataflow" })),
      history: [
        {
          nodes: JSON.parse(JSON.stringify(get().nodes)),
          edges: JSON.parse(
            JSON.stringify(
              edges.map((e) => ({ ...e, type: e.type || "dataflow" }))
            )
          ),
        },
      ],
      historyIndex: 0,
    }),
  setWorkflowMeta: (meta) =>
    set({ workflowMeta: get().workflowMeta ? { ...get().workflowMeta!, ...meta } : null }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setSaving: (saving) => set({ isSaving: saving }),

  reset: () =>
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      workflowMeta: null,
      isDirty: false,
      isSaving: false,
      history: [],
      historyIndex: -1,
      executionStatus: [],
      executionId: null,
    }),

  // Undo/Redo
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      set({
        nodes: JSON.parse(JSON.stringify(entry.nodes)),
        edges: JSON.parse(JSON.stringify(entry.edges)),
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      set({
        nodes: JSON.parse(JSON.stringify(entry.nodes)),
        edges: JSON.parse(JSON.stringify(entry.edges)),
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // Execution
  setExecutionStatus: (status) => set({ executionStatus: status }),
  setExecutionId: (id) => set({ executionId: id }),

  updateStepExecutionStatus: (stepId, status, output, error) => {
    set({
      executionStatus: [
        ...get().executionStatus.filter((s) => s.stepId !== stepId),
        { stepId, status, output, error },
      ],
      // Also update the node's data so custom nodes can display the status
      nodes: get().nodes.map((n) => {
        const nid = typeof n.id === "number" ? n.id : n.id.replace("node_", "");
        const match = String(nid) === String(stepId) || n.id === `node_${stepId}`;
        if (match) {
          return { ...n, data: { ...n.data, executionStatus: status as string } };
        }
        return n;
      }),
    });
  },

  clearExecutionStatus: () =>
    set({
      executionStatus: [],
      executionId: null,
      nodes: get().nodes.map((n) => ({
        ...n,
        data: { ...n.data, executionStatus: undefined },
      })),
    }),
}));
