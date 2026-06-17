"use client";

import { memo, useState, useCallback } from "react";
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type DataFlowEdgeData = {
  sourceLabel?: string;
  targetLabel?: string;
  lastOutput?: Record<string, unknown>;
  status?: "pending" | "success" | "error" | "running";
};

type DataFlowEdgeType = Edge<DataFlowEdgeData, "dataflow">;

type Props = EdgeProps<DataFlowEdgeType>;

function DataFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  selected,
  data,
  source,
  target,
}: Props) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [contextOpen, setContextOpen] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine color based on execution status
  const status = data?.status || "pending";
  const strokeColor =
    status === "success"
      ? "#22c55e"
      : status === "error"
        ? "#ef4444"
        : status === "running"
          ? "#3b82f6"
          : "#3b82f6";

  const sourceLabel = data?.sourceLabel || source;
  const targetLabel = data?.targetLabel || target;

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent) => {
      const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
      setTooltipPos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 100,
      });
      setTooltipVisible(true);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    if (!contextOpen) {
      setTooltipVisible(false);
    }
  }, [contextOpen]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    document.dispatchEvent(
      new CustomEvent("workflow:delete-edge", { detail: { edgeId: id } })
    );
    setContextOpen(false);
    setTooltipVisible(false);
  }, [id]);

  const handleViewData = useCallback(() => {
    document.dispatchEvent(
      new CustomEvent("workflow:view-edge-data", {
        detail: { edgeId: id, data: data },
      })
    );
    setContextOpen(false);
    setTooltipVisible(false);
  }, [id, data]);

  // Arrow marker ID unique to this edge
  const arrowId = `arrow-${id.replace(/[^a-zA-Z0-9]/g, "_")}`;

  return (
    <>
      {/* Invisible wider path for easier hover/click detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />

      {/* Dashed background line */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray: "6 4",
          opacity: 0.5,
          ...style,
        }}
      />

      {/* Animated dots moving along the path */}
      <g>
        <circle r="3" fill={strokeColor} className="dataflow-dot">
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
        <circle
          r="3"
          fill={strokeColor}
          className="dataflow-dot"
          style={{ animationDelay: "-0.5s" }}
        >
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path={edgePath}
            begin="-0.5s"
          />
        </circle>
        <circle
          r="3"
          fill={strokeColor}
          className="dataflow-dot"
          style={{ animationDelay: "-1s" }}
        >
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path={edgePath}
            begin="-1s"
          />
        </circle>
      </g>

      {/* Invisible arrow head — we use BaseEdge for rendering the marker */}
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Transparent edge just for the arrow marker */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
          fill: "none",
          markerEnd: `url(#${arrowId})`,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Hover Tooltip */}
      {tooltipVisible && (
        <foreignObject
          x={labelX - 100}
          y={labelY - 80}
          width={200}
          height={70}
          className="overflow-visible"
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-zinc-200 p-3 text-xs">
            <div className="font-semibold text-zinc-800 mb-1 truncate">
              {sourceLabel} → {targetLabel}
            </div>
            <div className="text-zinc-500 space-y-0.5">
              <span>Status: </span>
              <span
                className={
                  status === "success"
                    ? "text-green-600 font-medium"
                    : status === "error"
                      ? "text-red-600 font-medium"
                      : "text-blue-600 font-medium"
                }
              >
                {status === "running"
                  ? "Running..."
                  : status === "success"
                    ? "Success"
                    : status === "error"
                      ? "Error"
                      : "Pending"}
              </span>
            </div>
            {data?.lastOutput && (
              <div className="mt-1 text-zinc-400 truncate">
                Data: {JSON.stringify(data.lastOutput).slice(0, 40)}...
              </div>
            )}
          </div>
        </foreignObject>
      )}

      {/* Edge Context Menu — rendered via DropdownMenu */}
      <DropdownMenu open={contextOpen} onOpenChange={setContextOpen}>
        <DropdownMenuTrigger asChild>
          {/* Invisible trigger at the midpoint of the edge */}
          <g
            style={{ cursor: "context-menu" }}
            onContextMenu={handleContextMenu}
          >
            <rect
              x={labelX - 40}
              y={labelY - 12}
              width={80}
              height={24}
              fill="transparent"
              className="cursor-context-menu"
            />
          </g>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="top"
          sideOffset={4}
          className="bg-white border-zinc-200 min-w-[160px]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem
            className="text-zinc-700 focus:bg-zinc-100 cursor-pointer"
            onClick={handleDelete}
          >
            Delete connection
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-200" />
          <DropdownMenuItem
            className="text-zinc-700 focus:bg-zinc-100 cursor-pointer"
            onClick={handleViewData}
          >
            View data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default memo(DataFlowEdge);
