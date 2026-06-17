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
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { workflowsApi, stepsApi } from "@/lib/api";
import { useWorkflowStore } from "@/store/workflowStore";
import StepConfigPanel from "@/components/workflow/StepConfigPanel";

// Custom node imports
import TriggerNode from "@/components/workflow/nodes/TriggerNode";
import ActionNode from "@/components/workflow/nodes/ActionNode";
import ConditionNode from "@/components/workflow/nodes/ConditionNode";
import DelayNode from "@/components/workflow/nodes/DelayNode";
import HttpRequestNode from "@/components/workflow/nodes/HttpRequestNode";
import EmailNode from "@/components/workflow/nodes/EmailNode";
import TransformNode from "@/components/workflow/nodes/TransformNode";

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  http_request: HttpRequestNode,
  email: EmailNode,
  transform: TransformNode,
};

interface PaletteItem {
  type: string;
  label: string;
  category: "trigger" | "action";
  icon: React.ReactNode;
}

const paletteItems: PaletteItem[] = [
  { type: "trigger", label: "Webhook", category: "trigger", icon: <Zap className="h-3.5 w-3.5" /> },
  { type: "schedule", label: "Schedule", category: "trigger", icon: <Clock className="h-3.5 w-3.5" /> },
  { type: "http_request", label: "HTTP Request", category: "action", icon: <Globe className="h-3.5 w-3.5" /> },
  { type: "condition", label: "Condition", category: "action", icon: <GitBranch className="h-3.5 w-3.5" /> },
  { type: "delay", label: "Delay", category: "action", icon: <Clock className="h-3.5 w-3.5" /> },
  { type: "email", label: "Email", category: "action", icon: <Mail className="h-3.5 w-3.5" /> },
  { type: "action", label: "Action", category: "action", icon: <Code className="h-3.5 w-3.5" /> },
  { type: "transform", label: "Transform", category: "action", icon: <Code className="h-3.5 w-3.5" /> },
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
    setDirty,
    setSaving,
  } = useWorkflowStore();

  const [showConfig, setShowConfig] = useState(false);

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
          : step.step_type === "code" ? "transform"
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
      toast.success("Workflow exécuté avec succès");
      if (data.data?.id) {
        toast.info(
          <Link href={`/dashboard/executions/${data.data.id}`} className="underline">
            Voir les logs d'exécution
          </Link>,
          { duration: 5000 }
        );
      }
    },
    onError: (err: Error) => {
      toast.error("Erreur d'exécution: " + err.message);
    },
  });

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
        <div className="flex items-center gap-2">
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
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={handleExecute}
            disabled={executeMutation.isPending}
          >
            <Play className="h-4 w-4 mr-1" />
            {executeMutation.isPending ? "Exécution..." : "Exécuter"}
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
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
              fitView
              colorMode="dark"
              deleteKeyCode={["Backspace", "Delete"]}
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: "#52525b", strokeWidth: 2 },
              }}
            >
              <Background color="#1e293b" gap={16} />
              <Controls className="bg-zinc-900 border-zinc-800 [&>button]:border-zinc-700 [&>button]:bg-zinc-800 [&>button]:text-zinc-400 [&>button:hover]:bg-zinc-700" />
              <MiniMap
                className="bg-zinc-900 border-zinc-800"
                nodeColor={(n) => {
                  const type = n.type;
                  if (type === "trigger") return "#22c55e";
                  if (type === "condition") return "#f59e0b";
                  if (type === "delay") return "#3b82f6";
                  if (type === "http_request") return "#0ea5e9";
                  if (type === "email") return "#ec4899";
                  if (type === "transform") return "#06b6d4";
                  return "#8b5cf6";
                }}
                maskColor="rgba(9,9,11,0.7)"
              />
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
      </div>
    </div>
  );
}
