"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Zap } from "lucide-react";

type TriggerNodeData = {
  label?: string;
  [key: string]: unknown;
};

type TriggerNodeType = Node<TriggerNodeData, "trigger">;

function TriggerNode({ data, selected }: NodeProps<TriggerNodeType>) {
  return (
    <div
      className={`relative px-5 py-3 rounded-2xl bg-zinc-800 text-white border-2 transition-shadow ${
        selected ? "shadow-[0_0_0_2px_rgba(34,197,94,0.5)]" : ""
      }`}
      style={{ borderColor: "#22c55e" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full"
          style={{ backgroundColor: "rgba(34,197,94,0.2)" }}
        >
          <Zap className="h-4 w-4" style={{ color: "#22c55e" }} />
        </div>
        <span className="text-sm font-medium text-zinc-100">
          {data.label || "Trigger"}
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

export default memo(TriggerNode);
