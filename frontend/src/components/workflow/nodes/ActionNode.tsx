"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Play } from "lucide-react";

type ActionNodeData = {
  label?: string;
  [key: string]: unknown;
};

type ActionNodeType = Node<ActionNodeData, "action">;

function ActionNode({ data, selected }: NodeProps<ActionNodeType>) {
  return (
    <div
      className={`relative px-5 py-3 rounded-xl bg-zinc-800 text-white border-2 transition-shadow ${
        selected ? "shadow-[0_0_0_2px_rgba(139,92,246,0.5)]" : ""
      }`}
      style={{ borderColor: "#8b5cf6" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md"
          style={{ backgroundColor: "rgba(139,92,246,0.2)" }}
        >
          <Play className="h-4 w-4" style={{ color: "#8b5cf6" }} />
        </div>
        <span className="text-sm font-medium text-zinc-100">
          {data.label || "Action"}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
    </div>
  );
}

export default memo(ActionNode);
