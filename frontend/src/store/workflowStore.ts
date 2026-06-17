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

export type WorkflowState = {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  workflowMeta: WorkflowMeta | null;
  isDirty: boolean;
  isSaving: boolean;

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

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflowMeta: null,
  isDirty: false,
  isSaving: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges), isDirty: true });
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
      },
    };
    set({ nodes: [...get().nodes, newNode], isDirty: true });
    return newNode;
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNode: get().selectedNode?.id === id ? null : get().selectedNode,
      isDirty: true,
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
    });
  },

  updateNodeLabel: (id, label) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      ),
      isDirty: true,
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),
  clearSelection: () => set({ selectedNode: null }),

  loadWorkflow: (meta) => set({ workflowMeta: meta }),
  loadNodes: (nodes) => set({ nodes }),
  loadEdges: (edges) => set({ edges }),
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
    }),
}));
