"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { ShieldAlert, XCircle } from "lucide-react";

type ErrorHandlerNodeData = {
  label?: string;
  executionStatus?: string;
  [key: string]: unknown;
};

type ErrorHandlerNodeType = Node<ErrorHandlerNodeData, "error_handler">;

function ErrorHandlerNode({ data, selected }: NodeProps<ErrorHandlerNodeType>) {
  const execStatus = data.executionStatus;

  const getBorderColor = () => {
    if (execStatus === "pending") return "#eab308";
    if (execStatus === "running") return "#3b82f6";
    if (execStatus === "completed") return "#22c55e";
    if (execStatus === "failed") return "#ef4444";
    return "#f97316"; // amber/orange default
  };

  const getPulseClass = () => {
    if (execStatus === "pending" || execStatus === "running") return "animate-pulse";
    return "";
  };

  const getSelectedShadow = () => {
    if (selected) {
      const color = getBorderColor();
      return `shadow-[0_0_0_2px_${color}]`;
    }
    return "";
  };

  return (
    <div
      className={`relative px-5 py-3 rounded-2xl bg-zinc-800 text-white border-2 border-dashed transition-shadow ${getPulseClass()} ${getSelectedShadow()}`}
      style={{ borderColor: getBorderColor() }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full"
          style={{ backgroundColor: execStatus === "failed" ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.2)" }}
        >
          {execStatus === "failed" ? (
            <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
          ) : (
            <ShieldAlert className="h-4 w-4" style={{ color: getBorderColor() }} />
          )}
        </div>
        <span className="text-sm font-medium text-zinc-100">
          {data.label || "Error Handler"}
        </span>
        {execStatus === "running" && (
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        )}
        {execStatus === "completed" && (
          <span className="text-green-500 text-xs">✓</span>
        )}
      </div>
      {/* Error handlers can have source outputs too (for downstream after catching) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
      <div className="absolute -top-2 -right-2">
        <span className="text-[10px] font-bold uppercase bg-amber-600 text-white px-1.5 py-0.5 rounded-full">
          ERR
        </span>
      </div>
    </div>
  );
}

export default memo(ErrorHandlerNode);
