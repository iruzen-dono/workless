"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { GitBranch } from "lucide-react";

type ConditionNodeData = {
  label?: string;
  [key: string]: unknown;
};

type ConditionNodeType = Node<ConditionNodeData, "condition">;

function ConditionNode({ data, selected }: NodeProps<ConditionNodeType>) {
  return (
    <div
      className={`relative px-5 py-3 -skew-x-[8deg] bg-zinc-800 text-white border-2 transition-shadow ${
        selected ? "shadow-[0_0_0_2px_rgba(245,158,11,0.5)]" : ""
      }`}
      style={{ borderColor: "#f59e0b" }}
    >
      <div className="skew-x-[8deg]">
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-md"
            style={{ backgroundColor: "rgba(245,158,11,0.2)" }}
          >
            <GitBranch className="h-4 w-4" style={{ color: "#f59e0b" }} />
          </div>
          <span className="text-sm font-medium text-zinc-100">
            {data.label || "Condition"}
          </span>
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
          <span style={{ color: "#22c55e" }}>✓ oui</span>
          <span style={{ color: "#ef4444" }}>✗ non</span>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          id="yes"
          className="!bg-emerald-500 !border-emerald-600 !w-3 !h-3 !left-[30%]"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="no"
          className="!bg-red-500 !border-red-600 !w-3 !h-3 !left-[70%]"
        />
      </div>
    </div>
  );
}

export default memo(ConditionNode);
