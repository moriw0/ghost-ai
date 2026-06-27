"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNode } from "@/types/canvas";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";

export const CanvasNodeComponent = memo(function CanvasNodeComponent({
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNode>) {
  const backgroundColor = data.color ?? DEFAULT_NODE_COLOR.fill;

  return (
    <div
      className="group relative flex items-center justify-center rounded-xl text-sm font-medium select-none"
      style={{
        width: width ?? 160,
        height: height ?? 80,
        backgroundColor,
        color: DEFAULT_NODE_COLOR.text,
        border: `1px solid ${selected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
      }}
    >
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!opacity-0 group-hover:!opacity-100 !transition-opacity !w-2.5 !h-2.5 !bg-white !border-none !rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!opacity-0 group-hover:!opacity-100 !transition-opacity !w-2.5 !h-2.5 !bg-white !border-none !rounded-full"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!opacity-0 group-hover:!opacity-100 !transition-opacity !w-2.5 !h-2.5 !bg-white !border-none !rounded-full"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!opacity-0 group-hover:!opacity-100 !transition-opacity !w-2.5 !h-2.5 !bg-white !border-none !rounded-full"
      />
      <span className="truncate px-3">{data.label}</span>
    </div>
  );
});
