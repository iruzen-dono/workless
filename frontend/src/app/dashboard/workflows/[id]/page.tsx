"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import {
  Play,
  Save,
  ArrowLeft,
  Settings,
  Workflow,
} from "lucide-react";
import Link from "next/link";

// Mock initial nodes
const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    position: { x: 250, y: 0 },
    data: { label: "Webhook entrant" },
    style: {
      background: "#1e293b",
      color: "#e2e8f0",
      border: "1px solid #334155",
      borderRadius: "8px",
      padding: "10px 20px",
    },
  },
  {
    id: "2",
    position: { x: 250, y: 150 },
    data: { label: "Condition" },
    style: {
      background: "#1e293b",
      color: "#e2e8f0",
      border: "1px solid #f59e0b",
      borderRadius: "8px",
      padding: "10px 20px",
    },
  },
  {
    id: "3",
    position: { x: 100, y: 300 },
    data: { label: "Notification Slack" },
    style: {
      background: "#1e293b",
      color: "#e2e8f0",
      border: "1px solid #334155",
      borderRadius: "8px",
      padding: "10px 20px",
    },
  },
  {
    id: "4",
    position: { x: 400, y: 300 },
    data: { label: "Email confirmation" },
    style: {
      background: "#1e293b",
      color: "#e2e8f0",
      border: "1px solid #334155",
      borderRadius: "8px",
      padding: "10px 20px",
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", label: "oui" },
  { id: "e2-4", source: "2", target: "4", label: "non" },
];

export default function WorkflowBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [name, setName] = useState("Mon workflow");

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent text-zinc-100 font-semibold text-lg border-none outline-none focus:ring-0"
            />
            <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
              draft
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100"
          >
            <Settings className="h-4 w-4 mr-1" />
            Config
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Save className="h-4 w-4 mr-1" />
            Sauvegarder
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Play className="h-4 w-4 mr-1" />
            Exécuter
          </Button>
        </div>
      </div>

      {/* Step palette sidebar */}
      <div className="flex flex-1">
        <aside className="w-56 border-r border-zinc-800 bg-zinc-900 p-3 space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Steps
          </p>

          {/* Triggers */}
          <div className="space-y-1">
            <p className="text-xs text-zinc-600 mb-1">Déclencheurs</p>
            {["Webhook", "Schedule", "Manuel"].map((s) => (
              <div
                key={s}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 cursor-grab hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                {s}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-1 pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 mb-1">Actions</p>
            {["HTTP Request", "Condition", "Delay", "Email", "Discord", "Telegram", "Slack", "Transform"].map(
              (s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 cursor-grab hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <div className="h-2 w-2 rounded-full bg-violet-500" />
                  {s}
                </div>
              )
            )}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 bg-zinc-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            colorMode="dark"
          >
            <Background color="#1e293b" gap={16} />
            <Controls className="bg-zinc-900 border-zinc-800" />
            <MiniMap
              className="bg-zinc-900 border-zinc-800"
              nodeColor="#334155"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
