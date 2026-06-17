"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Clock } from "lucide-react";

type DelayNodeData = {
  label?: string;
  [key: string]: unknown;
};

type DelayNodeType = Node<DelayNodeData, "delay">;

function DelayNode({ data, selected }: NodeProps<DelayNodeType>) {
  return (
    <div
      className={`relative px-5 py-3 rounded-xl bg-zinc-800 text-white border-2 transition-shadow ${
        selected ? "shadow-[0_0_0_2px_rgba(59,130,246,0.5)]" : ""
      }`}
      style={{ borderColor: "#3b82f6" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full"
          style={{ backgroundColor: "rgba(59,130,246,0.2)" }}
        >
          <Clock className="h-4 w-4" style={{ color: "#3b82f6" }} />
        </div>
        <span className="text-sm font-medium text-zinc-100">
          {data.label || "Delay"}
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

export default memo(DelayNode);
