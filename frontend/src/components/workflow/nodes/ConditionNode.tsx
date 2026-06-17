"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { GitBranch, XCircle } from "lucide-react";

type ConditionNodeData = {
  label?: string;
  executionStatus?: string;
  [key: string]: unknown;
};

type ConditionNodeType = Node<ConditionNodeData, "condition">;

function ConditionNode({ data, selected }: NodeProps<ConditionNodeType>) {
  const execStatus = data.executionStatus;

  const getBorderColor = () => {
    if (execStatus === "pending") return "#eab308";
    if (execStatus === "running") return "#3b82f6";
    if (execStatus === "completed") return "#22c55e";
    if (execStatus === "failed") return "#ef4444";
    return "#f59e0b";
  };

  const getPulseClass = () => {
    if (execStatus === "pending") return "animate-pulse";
    if (execStatus === "running") return "animate-pulse";
    return "";
  };

  const getSelectedShadow = () => {
    if (selected) {
      const color = getBorderColor();
      // Use rgba equivalent for shadow
      const rgbaColor = execStatus === "pending" ? "rgba(234,179,8,0.5)"
        : execStatus === "running" ? "rgba(59,130,246,0.5)"
        : execStatus === "completed" ? "rgba(34,197,94,0.5)"
        : execStatus === "failed" ? "rgba(239,68,68,0.5)"
        : "rgba(245,158,11,0.5)";
      return `shadow-[0_0_0_2px_${rgbaColor}]`;
    }
    return "";
  };

  return (
    <div
      className={`relative px-5 py-3 -skew-x-[8deg] bg-zinc-800 text-white border-2 transition-shadow ${getPulseClass()} ${getSelectedShadow()}`}
      style={{ borderColor: getBorderColor() }}
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
            style={{ backgroundColor: execStatus === "failed" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)" }}
          >
            {execStatus === "failed" ? (
              <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
            ) : (
              <GitBranch className="h-4 w-4" style={{ color: getBorderColor() }} />
            )}
          </div>
          <span className="text-sm font-medium text-zinc-100">
            {data.label || "Condition"}
          </span>
          {execStatus === "running" && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          )}
          {execStatus === "completed" && (
            <span className="text-green-500 text-xs">✓</span>
          )}
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
