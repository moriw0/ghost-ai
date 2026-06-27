"use client";

import { memo, useState, useRef, useCallback } from "react";
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from "@xyflow/react";
import { useMutation } from "@liveblocks/react";
import type { CanvasEdge, CanvasEdgeData } from "@/types/canvas";

export const CanvasEdgeComponent = memo(function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = selected || isHovered;
  const strokeColor = isActive ? "#f8fafc" : "rgba(248, 250, 252, 0.4)";
  const markerId = `canvas-edge-arrow-${id}`;

  const updateEdgeLabel = useMutation(
    ({ storage }, { edgeId, label }: { edgeId: string; label: string }) => {
      const edge = storage.get("flow").get("edges").get(edgeId);
      if (!edge) return;
      const current = (edge.get("data") as unknown as CanvasEdgeData) ?? {};
      (edge as unknown as { set(k: string, v: unknown): void }).set("data", {
        ...current,
        label,
      });
    },
    []
  );

  const startEditing = useCallback(() => {
    setLocalLabel(data?.label ?? "");
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [data?.label]);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      startEditing();
    },
    [startEditing]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalLabel(value);
      updateEdgeLabel({ edgeId: id, label: value });
    },
    [id, updateEdgeLabel]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === "Enter" || e.key === "Escape") {
        stopEditing();
      }
    },
    [stopEditing]
  );

  const labelContent = (() => {
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          value={localLabel}
          onChange={handleChange}
          onBlur={stopEditing}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          size={Math.max(8, localLabel.length + 2)}
          className="nodrag nopan bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)] outline-none"
          placeholder="Label"
        />
      );
    }
    if (data?.label) {
      return (
        <span className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full px-2 py-0.5 text-xs text-[var(--text-secondary)] select-none whitespace-nowrap">
          {data.label}
        </span>
      );
    }
    if (isActive) {
      return (
        <span className="text-xs text-[var(--text-faint)] select-none px-1">
          double-click to label
        </span>
      );
    }
    return null;
  })();

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 8 4 L 0 8 Z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Wide invisible hit area — makes edges easier to click without widening the visible line */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      />

      {/* Visible edge */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        style={{ transition: "stroke 0.15s", pointerEvents: "none" }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDoubleClick={handleDoubleClick}
        >
          {labelContent}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
