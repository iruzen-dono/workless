"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Sparkles } from "lucide-react";

type AiNodeData = {
  label?: string;
  provider?: string;
  model?: string;
  executionStatus?: "pending" | "running" | "completed" | "failed" | "paused";
};

function AiNode({ data }: NodeProps<Node<AiNodeData, "ai">>) {
  const status = data.executionStatus;
  const provider = data.provider || "openai";
  const model = data.model || "gpt-4o-mini";

  const statusConfig = {
    pending: { dot: "bg-amber-400", pulse: "animate-pulse" },
    running: { dot: "bg-blue-400", pulse: "animate-pulse" },
    completed: { dot: "bg-green-400", pulse: "" },
    failed: { dot: "bg-red-400", pulse: "" },
    paused: { dot: "bg-amber-400", pulse: "" },
  };

  const sc = status ? statusConfig[status] : statusConfig.pending;

  return (
    <div
      className={`relative rounded-xl border-2 bg-zinc-800/90 px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-200
        ${status === "running" ? "border-blue-400/70 shadow-blue-500/20" : "border-purple-500/50"}`}
    >
      {/* Status dot */}
      <div
        className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ring-2 ring-zinc-900 ${sc.dot} ${sc.pulse}`}
      />

      {/* Target handle (receives input) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-zinc-700 !bg-purple-400"
      />

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">
              {data.label || "AI"}
            </span>
            <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
              AI
            </span>
          </div>
          <div className="text-[10px] text-zinc-500">
            {provider} · {model}
          </div>
        </div>
      </div>

      {/* Source handle (output) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-zinc-700 !bg-purple-400"
      />
    </div>
  );
}

export default memo(AiNode);
