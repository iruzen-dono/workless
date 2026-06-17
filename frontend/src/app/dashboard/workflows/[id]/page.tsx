"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Play,
  Save,
  ArrowLeft,
  Zap,
  GitBranch,
  Clock,
  Globe,
  Mail,
  Code,
  Code2,
  ShieldAlert,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Download,
  Maximize,
  Map,
  FileDown,
  LayoutGrid,
  Link as LinkIcon,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { workflowsApi, stepsApi, executionsApi } from "@/lib/api";
import { useWorkflowStore } from "@/store/workflowStore";
import type { ExecutionStepResult } from "@/types";
import StepConfigPanel from "@/components/workflow/StepConfigPanel";
import DataFlowEdge from "@/components/workflow/edges/DataFlowEdge";

// Custom node imports
import TriggerNode from "@/components/workflow/nodes/TriggerNode";
import ActionNode from "@/components/workflow/nodes/ActionNode";
import ConditionNode from "@/components/workflow/nodes/ConditionNode";
import DelayNode from "@/components/workflow/nodes/DelayNode";
import HttpRequestNode from "@/components/workflow/nodes/HttpRequestNode";
import EmailNode from "@/components/workflow/nodes/EmailNode";
import TransformNode from "@/components/workflow/nodes/TransformNode";
import ErrorHandlerNode from "@/components/workflow/nodes/ErrorHandlerNode";
import CodeNode from "@/components/workflow/nodes/CodeNode";
import WebhookNode from "@/components/workflow/nodes/WebhookNode";
import ApprovalNode from "@/components/workflow/nodes/ApprovalNode";

const nodeTypes = {
  trigger: TriggerNode,
  webhook: WebhookNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  http_request: HttpRequestNode,
  email: EmailNode,
  transform: TransformNode,
  error_handler: ErrorHandlerNode,
  code: CodeNode,
  approval: ApprovalNode,
};

const edgeTypes = {
  dataflow: DataFlowEdge,
};

interface PaletteItem {
  type: string;
  label: string;
  category: "trigger" | "action";
  icon: React.ReactNode;
}

const paletteItems: PaletteItem[] = [
  { type: "trigger", label: "Webhook (Trigger)", category: "trigger", icon: <Zap className="h-3.5 w-3.5" /> },
  { type: "webhook", label: "Webhook", category: "trigger", icon: <LinkIcon className="h-3.5 w-3.5" /> },
  { type: "schedule", label: "Schedule", category: "trigger", icon: <Clock className="h-3.5 w-3.5" /> },
  { type: "http_request", label: "HTTP Request", category: "action", icon: <Globe className="h-3.5 w-3.5" /> },
  { type: "condition", label: "Condition", category: "action", icon: <GitBranch className="h-3.5 w-3.5" /> },
  { type: "delay", label: "Delay", category: "action", icon: <Clock className="h-3.5 w-3.5" /> },
  { type: "email", label: "Email", category: "action", icon: <Mail className="h-3.5 w-3.5" /> },
  { type: "action", label: "Action", category: "action", icon: <Code className="h-3.5 w-3.5" /> },
  { type: "transform", label: "Transform", category: "action", icon: <Code className="h-3.5 w-3.5" /> },
  { type: "code", label: "Code", category: "action", icon: <Code2 className="h-3.5 w-3.5" /> },
  { type: "error_handler", label: "Error Handler", category: "action", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  { type: "approval", label: "Approval", category: "action", icon: <UserCheck className="h-3.5 w-3.5" /> },
];

const categoryColors: Record<string, string> = {
  trigger: "border-emerald-500/30 hover:border-emerald-500/60",
  action: "border-violet-500/30 hover:border-violet-500/60",
};

const categoryDotColors: Record<string, string> = {
  trigger: "bg-emerald-500",
  action: "bg-violet-500",
};

export default function WorkflowBuilderPage() {
  const params = useParams();
  const workflowId = Number(params.id);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const {
    nodes,
    edges,
    selectedNode,
    workflowMeta,
    isDirty,
    isSaving,
    executionStatus,
    executionId,
    historyIndex,
    history,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNode,
    updateNodeConfig,
    updateNodeLabel,
    setSelectedNode: selectNode,
    clearSelection,
    loadWorkflow,
    loadNodes,
    loadEdges,
    setWorkflowMeta,
    setDirty,
    setSaving,
    setExecutionId,
    updateStepExecutionStatus,
    clearExecutionStatus,
    undo,
    redo,
  } = useWorkflowStore();

  const [showConfig, setShowConfig] = useState(false);
  const [clipboard, setClipboard] = useState<Node | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [edgeDataDialog, setEdgeDataDialog] = useState<{
    open: boolean;
    data?: Record<string, unknown>;
    sourceLabel?: string;
    targetLabel?: string;
  }>({ open: false });

  // Derived undo/redo state
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Load workflow data
  const { data: workflowData, isLoading: workflowLoading } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => workflowsApi.get(workflowId),
    enabled: !!workflowId,
  });

  const { data: stepsData } = useQuery({
    queryKey: ["steps", workflowId],
    queryFn: () => stepsApi.list(workflowId),
    enabled: !!workflowId,
  });

  // Load connections
  const { data: connectionsData } = useQuery({
    queryKey: ["connections", workflowId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/workflows/${workflowId}/connections`
      );
      return res.json();
    },
    enabled: !!workflowId,
  });

  // Load workflow meta when data arrives
  useEffect(() => {
    if (workflowData?.data) {
      const wf = workflowData.data;
      loadWorkflow({
        id: wf.id,
        name: wf.name,
        status: wf.status,
      });
    }
  }, [workflowData]);

  // Convert API steps to React Flow nodes
  useEffect(() => {
    if (stepsData?.data && stepsData.data.length > 0) {
      const flowNodes: Node[] = stepsData.data.map((step) => ({
        id: String(step.id),
        type: step.step_type === "loop" ? "action"
          : step.step_type,
        position: {
          x: step.position_x ?? 250,
          y: step.position_y ?? 0,
        },
        data: {
          label: step.label || step.step_type,
          stepType: step.step_type,
          config: step.config || {},
        },
      }));
      loadNodes(flowNodes);
    }
  }, [stepsData]);

  // Convert API connections to React Flow edges
  useEffect(() => {
    if (connectionsData?.data && connectionsData.data.length > 0) {
      const flowEdges: Edge[] = connectionsData.data.map((conn: { id: number; source_step_id: number; target_step_id: number; source_port?: string | null }) => ({
        id: String(conn.id),
        source: String(conn.source_step_id),
        target: String(conn.target_step_id),
        sourceHandle: conn.source_port || undefined,
      }));
      loadEdges(flowEdges);
    }
  }, [connectionsData]);

  // Listen for edge context menu events
  useEffect(() => {
    const handleDeleteEdge = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const edgeId = detail.edgeId;
      const { edges: currentEdges } = useWorkflowStore.getState();
      const newEdges = currentEdges.filter((edg) => edg.id !== edgeId);
      useWorkflowStore.getState().setEdges(newEdges);
      toast.success("Connection supprimée");
    };

    const handleViewEdgeData = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const edgeData = detail.data;
      setEdgeDataDialog({
        open: true,
        data: edgeData?.lastOutput || undefined,
        sourceLabel: edgeData?.sourceLabel || detail.edgeId,
        targetLabel: edgeData?.targetLabel || undefined,
      });
    };

    document.addEventListener("workflow:delete-edge", handleDeleteEdge);
    document.addEventListener("workflow:view-edge-data", handleViewEdgeData);
    return () => {
      document.removeEventListener("workflow:delete-edge", handleDeleteEdge);
      document.removeEventListener(
        "workflow:view-edge-data",
        handleViewEdgeData
      );
    };
  }, []);

  // Save workflow mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      await workflowsApi.update(workflowId, {
        name: workflowMeta?.name || "Workflow",
      });
      // Save each node as a step
      for (const node of nodes) {
        await stepsApi.update(workflowId, Number(node.id), {
          step_type: (node.data?.stepType as string) as any || "action",
          config: (node.data?.config as Record<string, unknown>) || {},
          label: (node.data?.label as string) || "",
          position_x: Math.round(node.position.x),
          position_y: Math.round(node.position.y),
        });
      }
    },
    onSuccess: () => {
      setDirty(false);
      setSaving(false);
      toast.success("Workflow sauvegardé");
    },
    onError: (err: Error) => {
      setSaving(false);
      toast.error("Erreur lors de la sauvegarde: " + err.message);
    },
  });

  // Execute workflow mutation
  const executeMutation = useMutation({
    mutationFn: () => workflowsApi.execute(workflowId),
    onSuccess: (data) => {
      clearExecutionStatus();
      const execId = data.data?.id;
      if (execId) {
        setExecutionId(execId);
        toast.success("Workflow en cours d'exécution...");
      } else {
        toast.success("Workflow exécuté avec succès");
      }
    },
    onError: (err: Error) => {
      toast.error("Erreur d'exécution: " + err.message);
    },
  });

  // Poll execution status
  useEffect(() => {
    if (!executionId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await executionsApi.get(Number(executionId));
        const exec = response.data as any;

        // Update step results
        if (exec.step_results) {
          for (const result of exec.step_results) {
            const status = result.status === "skipped" ? "completed" : result.status;
            updateStepExecutionStatus(
              result.step_id,
              status as any,
              result.output_data || undefined,
              result.error_message || undefined
            );
          }
        }

        // Stop polling if execution is done
        if (exec.status === "completed" || exec.status === "failed" || exec.status === "cancelled") {
          setExecutionId(null);
          toast.info(
            exec.status === "completed"
              ? "Exécution terminée avec succès"
              : `Exécution ${exec.status}`
          );
          return;
        }
      } catch {
        // Silently handle poll errors
      }

      if (!cancelled) {
        setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [executionId]);

  // Drag & Drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNode(type, position);
    },
    [reactFlowInstance, addNode]
  );

  const onDragStart = (event: React.DragEvent, type: string) => {
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node);
      setShowConfig(true);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
    setShowConfig(false);
  }, [clearSelection]);

  const handleAutoLayout = useCallback(() => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 120, marginx: 40, marginy: 40 });

    const currentNodes = useWorkflowStore.getState().nodes;
    const currentEdges = useWorkflowStore.getState().edges;

    if (currentNodes.length === 0) return;

    // Default node dimensions
    const nodeWidth = 220;
    const nodeHeight = 80;

    for (const node of currentNodes) {
      g.setNode(node.id, {
        width: nodeWidth,
        height: nodeHeight,
      });
    }

    for (const edge of currentEdges) {
      g.setEdge(edge.source, edge.target);
    }

    dagre.layout(g);

    const layoutedNodes = currentNodes.map((node) => {
      const pos = g.node(node.id);
      return {
        ...node,
        position: {
          x: pos.x - nodeWidth / 2,
          y: pos.y - nodeHeight / 2,
        },
      };
    });

    useWorkflowStore.getState().setNodes(layoutedNodes);
    toast.success("Auto-layout appliqué");
  }, []);

  const handleZoomToFit = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 200 });
  }, [reactFlowInstance]);

  const handleToggleMinimap = useCallback(() => {
    setShowMinimap((prev) => !prev);
  }, []);

  const handleSave = () => {
    if (workflowMeta) {
      saveMutation.mutate();
    } else {
      toast.error("Aucun workflow chargé");
    }
  };

  const handleExecute = () => {
    if (workflowId) {
      executeMutation.mutate();
    } else {
      toast.error("Aucun workflow chargé");
    }
  };

  const handleDeleteNode = (id: string) => {
    removeNode(id);
    toast.success("Step supprimé");
  };

  const handleApplyConfig = (id: string, config: Record<string, unknown>) => {
    updateNodeConfig(id, config);
    toast.success("Configuration appliquée");
  };

  const handleLabelChange = (id: string, label: string) => {
    updateNodeLabel(id, label);
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  // Clipboard state
  const handleCopyNode = () => {
    if (selectedNode) {
      setClipboard({ ...selectedNode });
      toast.success("Step copié");
    }
  };

  const handlePasteNode = () => {
    if (!clipboard || !reactFlowInstance) return;
    const newPos = {
      x: clipboard.position.x + 50,
      y: clipboard.position.y + 50,
    };
    const stepType = (clipboard.data?.stepType as string) || "action";
    addNode(stepType, newPos, clipboard.data?.label as string);
    toast.success("Step collé");
  };

  const handleExport = async () => {
    const currentNodes = useWorkflowStore.getState().nodes;
    const currentEdges = useWorkflowStore.getState().edges;

    const exportData = {
      name: workflowMeta?.name || "Workflow",
      description: workflowData?.data?.description || null,
      version: 1,
      steps: currentNodes.map((node) => ({
        id: node.id,
        type: (node.data?.stepType as string) || "action",
        label: node.data?.label as string,
        config: node.data?.config || {},
        position: { x: node.position.x, y: node.position.y },
      })),
      connections: currentEdges.map((edge) => ({
        from: edge.source,
        to: edge.target,
        sourceHandle: edge.sourceHandle || undefined,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${(workflowMeta?.name || "workflow").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow exporté");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Allow Escape and Ctrl+S even in inputs
        if (!(e.key === "Escape" || (e.key === "s" && (e.ctrlKey || e.metaKey)))) {
          return;
        }
      }

      // Ctrl+Z / Cmd+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z → Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+S / Cmd+S → Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      // Delete / Backspace → Delete selected node
      if (e.key === "Delete" || e.key === "Backspace") {
        // Backspace should not fire when input is focused (already handled above)
        if (selectedNode) {
          e.preventDefault();
          handleDeleteNode(selectedNode.id);
        }
        return;
      }

      // Ctrl+C / Cmd+C → Copy selected node
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        if (selectedNode) {
          e.preventDefault();
          handleCopyNode();
        }
        return;
      }

      // Ctrl+V / Cmd+V → Paste node
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        if (clipboard) {
          e.preventDefault();
          handlePasteNode();
        }
        return;
      }

      // Ctrl+Shift+L / Cmd+Shift+L → Auto Layout
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "l") {
        e.preventDefault();
        handleAutoLayout();
        return;
      }

      // Ctrl+0 / Cmd+0 → Zoom to Fit
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        handleZoomToFit();
        return;
      }

      // Ctrl+M / Cmd+M → Toggle Minimap
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        handleToggleMinimap();
        return;
      }

      // Escape → Close config panel and clear selection
      if (e.key === "Escape") {
        setShowConfig(false);
        clearSelection();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, clipboard, handleUndo, handleRedo, handleAutoLayout, handleZoomToFit, handleToggleMinimap]);

  if (workflowLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="text-zinc-500">Chargement du workflow...</div>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    draft: "bg-zinc-800 text-zinc-400",
    active: "bg-emerald-900/30 text-emerald-400",
    paused: "bg-amber-900/30 text-amber-400",
    archived: "bg-zinc-800 text-zinc-500",
  };

  // Execution overlay data
  const runningSteps = executionStatus.filter((s) => s.status === "running");
  const completedSteps = executionStatus.filter((s) => s.status === "completed");
  const failedSteps = executionStatus.filter((s) => s.status === "failed");
  const isExecuting = !!executionId;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workflows"
            className="text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <input
              value={workflowMeta?.name || "Workflow"}
              onChange={(e) =>
                useWorkflowStore.getState().setWorkflowMeta({ name: e.target.value })
              }
              className="bg-transparent text-zinc-100 font-semibold text-lg border-none outline-none focus:ring-0"
            />
            {workflowMeta?.status && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  statusColor[workflowMeta.status] || "bg-zinc-800 text-zinc-500"
                }`}
              >
                {workflowMeta.status}
              </span>
            )}
            {isDirty && (
              <span className="text-xs text-amber-500">• Modifications non sauvegardées</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Undo/Redo buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Refaire (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Copy/Paste buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
            onClick={handleCopyNode}
            disabled={!selectedNode}
            title="Copier le step (Ctrl+C)"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
            onClick={handlePasteNode}
            disabled={!clipboard}
            title="Coller le step (Ctrl+V)"
          >
            <ClipboardPaste className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Auto Layout button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
            onClick={handleAutoLayout}
            title="Auto Layout (Ctrl+Shift+L)"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>

          {/* Zoom to Fit button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
            onClick={handleZoomToFit}
            title="Zoom to Fit (Ctrl+0)"
          >
            <Maximize className="h-4 w-4" />
          </Button>

          {/* Toggle Minimap button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
            onClick={handleToggleMinimap}
            title={showMinimap ? "Cacher la minimap (Ctrl+M)" : "Afficher la minimap (Ctrl+M)"}
          >
            <Map className={`h-4 w-4 ${showMinimap ? "" : "text-zinc-600"}`} />
          </Button>

          {/* Export button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
            onClick={handleExport}
            title="Exporter le workflow"
          >
            <FileDown className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Execution indicator */}
          {isExecuting && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-900/30 border border-blue-800/50">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs text-blue-400 font-medium">
                Exécution en cours...
              </span>
            </div>
          )}

          {/* Save button */}
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>

          {/* Execute button */}
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={handleExecute}
            disabled={executeMutation.isPending || isExecuting}
          >
            <Play className="h-4 w-4 mr-1" />
            {executeMutation.isPending || isExecuting ? "Exécution..." : "Exécuter"}
          </Button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Export button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
            title="Exporter en template"
            onClick={() => {
              window.location.href = `/dashboard/workflows/${workflowId}/export`;
            }}
          >
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Step palette sidebar */}
        <aside className="w-56 border-r border-zinc-800 bg-zinc-900 p-3 space-y-2 overflow-y-auto shrink-0">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Steps
          </p>

          {/* Triggers */}
          <div className="space-y-1">
            <p className="text-xs text-zinc-600 mb-1">Déclencheurs</p>
            {paletteItems
              .filter((item) => item.category === "trigger")
              .map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className={`flex items-center gap-2 rounded-lg border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 cursor-grab hover:bg-zinc-800 transition-colors ${categoryColors[item.category]}`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${categoryDotColors[item.category]}`}
                  />
                  {item.icon}
                  {item.label}
                </div>
              ))}
          </div>

          {/* Actions */}
          <div className="space-y-1 pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 mb-1">Actions</p>
            {paletteItems
              .filter((item) => item.category === "action")
              .map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className={`flex items-center gap-2 rounded-lg border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 cursor-grab hover:bg-zinc-800 transition-colors ${categoryColors[item.category]}`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${categoryDotColors[item.category]}`}
                  />
                  {item.icon}
                  {item.label}
                </div>
              ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 bg-zinc-950" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              colorMode="dark"
              deleteKeyCode={["Backspace", "Delete"]}
              snapToGrid={true}
              snapGrid={[15, 15]}
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: "#52525b", strokeWidth: 2 },
              }}
            >
              <Background color="#1e293b" gap={16} />
              <Controls className="bg-zinc-900 border-zinc-800 [&>button]:border-zinc-700 [&>button]:bg-zinc-800 [&>button]:text-zinc-400 [&>button:hover]:bg-zinc-700" />
              {showMinimap && (
                <MiniMap
                  className="bg-zinc-900 border-zinc-800"
                  nodeColor={(n) => {
                    const type = n.type;
                    if (type === "trigger") return "#22c55e";
                    if (type === "webhook") return "#8b5cf6";
                    if (type === "condition") return "#f59e0b";
                    if (type === "delay") return "#3b82f6";
                    if (type === "http_request") return "#0ea5e9";
                    if (type === "email") return "#ec4899";
                    if (type === "transform") return "#06b6d4";
                    if (type === "code") return "#14b8a6";
                    if (type === "error_handler") return "#f97316";
                    if (type === "approval") return "#ec4899";
                    return "#8b5cf6";
                  }}
                  maskColor="rgba(9,9,11,0.7)"
                />
              )}
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Config panel */}
        {showConfig && selectedNode && (
          <StepConfigPanel
            node={selectedNode}
            onClose={() => {
              setShowConfig(false);
              clearSelection();
            }}
            onDelete={handleDeleteNode}
            onApply={handleApplyConfig}
            onLabelChange={handleLabelChange}
          />
        )}

        {/* Execution overlay */}
        {isExecuting && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg shadow-xl px-4 py-3 min-w-[280px] backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-zinc-200">
                  Exécution en cours...
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Steps complétés</span>
                  <span className="text-green-400">{completedSteps.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">En cours</span>
                  <span className="text-blue-400">{runningSteps.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Échecs</span>
                  <span className="text-red-400">{failedSteps.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edge data viewer dialog */}
        {edgeDataDialog.open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setEdgeDataDialog({ open: false })}
          >
            <div
              className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
                <h3 className="text-base font-semibold text-zinc-800">
                  Edge Data
                </h3>
                <button
                  onClick={() => setEdgeDataDialog({ open: false })}
                  className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                {edgeDataDialog.sourceLabel && (
                  <div className="text-sm text-zinc-500">
                    <span className="font-medium text-zinc-700">Connection: </span>
                    {edgeDataDialog.sourceLabel}
                    {edgeDataDialog.targetLabel && <> → {edgeDataDialog.targetLabel}</>}
                  </div>
                )}
                <div className="text-sm font-medium text-zinc-700">
                  Last Output Data
                </div>
                <pre className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-600 font-mono overflow-auto max-h-60 whitespace-pre-wrap">
                  {edgeDataDialog.data
                    ? JSON.stringify(edgeDataDialog.data, null, 2)
                    : "No data available"}
                </pre>
              </div>
              <div className="px-5 py-3 border-t border-zinc-200 flex justify-end">
                <button
                  onClick={() => setEdgeDataDialog({ open: false })}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
