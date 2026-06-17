"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Code } from "lucide-react";

type TransformNodeData = {
  label?: string;
  [key: string]: unknown;
};

type TransformNodeType = Node<TransformNodeData, "transform">;

function TransformNode({ data, selected }: NodeProps<TransformNodeType>) {
  return (
    <div
      className={`relative px-5 py-3 rounded-xl bg-zinc-800 text-white border-2 transition-shadow ${
        selected ? "shadow-[0_0_0_2px_rgba(6,182,212,0.5)]" : ""
      }`}
      style={{ borderColor: "#06b6d4" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md"
          style={{ backgroundColor: "rgba(6,182,212,0.2)" }}
        >
          <Code className="h-4 w-4" style={{ color: "#06b6d4" }} />
        </div>
        <span className="text-sm font-medium text-zinc-100">
          {data.label || "Transform"}
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

export default memo(TransformNode);
