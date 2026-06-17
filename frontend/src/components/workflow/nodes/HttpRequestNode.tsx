"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Globe, XCircle } from "lucide-react";

type HttpRequestNodeData = {
  label?: string;
  executionStatus?: string;
  [key: string]: unknown;
};

type HttpRequestNodeType = Node<HttpRequestNodeData, "http_request">;

function HttpRequestNode({ data, selected }: NodeProps<HttpRequestNodeType>) {
  const execStatus = data.executionStatus;

  const getBorderColor = () => {
    if (execStatus === "pending") return "#eab308";
    if (execStatus === "running") return "#3b82f6";
    if (execStatus === "completed") return "#22c55e";
    if (execStatus === "failed") return "#ef4444";
    return "#0ea5e9";
  };

  const getPulseClass = () => {
    if (execStatus === "pending") return "animate-pulse";
    if (execStatus === "running") return "animate-pulse";
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
      className={`relative px-5 py-3 rounded-xl bg-zinc-800 text-white border-2 transition-shadow ${getPulseClass()} ${getSelectedShadow()}`}
      style={{ borderColor: getBorderColor() }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md"
          style={{ backgroundColor: execStatus === "failed" ? "rgba(239,68,68,0.2)" : "rgba(14,165,233,0.2)" }}
        >
          {execStatus === "failed" ? (
            <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
          ) : (
            <Globe className="h-4 w-4" style={{ color: getBorderColor() }} />
          )}
        </div>
        <span className="text-sm font-medium text-zinc-100">
          {data.label || "HTTP Request"}
        </span>
        {execStatus === "running" && (
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        )}
        {execStatus === "completed" && (
          <span className="text-green-500 text-xs">✓</span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
    </div>
  );
}

export default memo(HttpRequestNode);
