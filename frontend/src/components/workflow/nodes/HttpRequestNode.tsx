"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Globe } from "lucide-react";

type HttpRequestNodeData = {
  label?: string;
  [key: string]: unknown;
};

type HttpRequestNodeType = Node<HttpRequestNodeData, "http_request">;

function HttpRequestNode({ data, selected }: NodeProps<HttpRequestNodeType>) {
  return (
    <div
      className={`relative px-5 py-3 rounded-xl bg-zinc-800 text-white border-2 transition-shadow ${
        selected ? "shadow-[0_0_0_2px_rgba(14,165,233,0.5)]" : ""
      }`}
      style={{ borderColor: "#0ea5e9" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !border-zinc-700 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md"
          style={{ backgroundColor: "rgba(14,165,233,0.2)" }}
        >
          <Globe className="h-4 w-4" style={{ color: "#0ea5e9" }} />
        </div>
        <span className="text-sm font-medium text-zinc-100">
          {data.label || "HTTP Request"}
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

export default memo(HttpRequestNode);
