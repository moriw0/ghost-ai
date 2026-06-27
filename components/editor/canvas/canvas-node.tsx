"use client";

import { memo, useState, useRef, useCallback } from "react";
import { Handle, Position, type NodeProps, NodeResizer } from "@xyflow/react";
import { useMutation } from "@liveblocks/react";
import type { CanvasNode, CanvasNodeData, NodeColor } from "@/types/canvas";
import { DEFAULT_NODE_COLOR, NODE_COLORS } from "@/types/canvas";
import { NodeShape } from "./node-shape";
import { ColorToolbar } from "./color-toolbar";

const MIN_WIDTH = 60;
const MIN_HEIGHT = 40;

const HANDLE_CLASS =
  "!opacity-0 group-hover:!opacity-100 !transition-opacity !w-2.5 !h-2.5 !bg-white !border-2 !border-[#080809] !rounded-full";

export const CanvasNodeComponent = memo(function CanvasNodeComponent({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const w = width ?? 160;
  const h = height ?? 80;
  const shape = data.shape ?? "rectangle";
  const fill = data.color ?? DEFAULT_NODE_COLOR.fill;
  const colorPair = NODE_COLORS.find((c) => c.fill === fill) ?? DEFAULT_NODE_COLOR;
  const stroke = selected ? "var(--accent-primary)" : "var(--border-subtle)";

  const updateNodeColor = useMutation(
    ({ storage }, { nodeId, color }: { nodeId: string; color: NodeColor }) => {
      const node = storage.get("flow").get("nodes").get(nodeId);
      if (!node) return;
      const current = node.get("data") as unknown as CanvasNodeData;
      (node as unknown as { set(k: string, v: unknown): void }).set("data", {
        ...current,
        color: color.fill,
      });
    },
    []
  );

  const updateNodeLabel = useMutation(
    ({ storage }, { nodeId, label }: { nodeId: string; label: string }) => {
      const node = storage.get("flow").get("nodes").get(nodeId);
      if (!node) return;
      // data is stored as plain JSON inside the node LiveObject, not as a nested LiveObject
      const current = node.get("data") as unknown as CanvasNodeData;
      (node as unknown as { set(k: string, v: unknown): void }).set("data", { ...current, label });
    },
    []
  );

  const startEditing = useCallback(() => {
    setLocalLabel(data.label);
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 0);
  }, [data.label]);

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
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalLabel(value);
      updateNodeLabel({ nodeId: id, label: value });
    },
    [id, updateNodeLabel]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        stopEditing();
      }
    },
    [stopEditing]
  );

  const paddingV = Math.max(8, Math.floor((h - 20) / 2));

  return (
    <div
      className="group relative flex items-center justify-center select-none"
      style={{ width: w, height: h }}
      onDoubleClick={handleDoubleClick}
    >
      {selected && (
        <ColorToolbar
          activeFill={fill}
          onSelect={(color) => updateNodeColor({ nodeId: id, color })}
        />
      )}
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        lineStyle={{ stroke: "var(--accent-primary)", strokeWidth: 1, opacity: 0.6 }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: "var(--bg-base)",
          border: "1.5px solid var(--accent-primary)",
        }}
      />
      <NodeShape shape={shape} width={w} height={h} fill={fill} stroke={stroke} />
      <Handle type="source" position={Position.Top} id="top" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right} id="right" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Left} id="left" className={HANDLE_CLASS} />
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="nodrag nopan absolute inset-0 z-10 resize-none bg-transparent border-none outline-none text-center text-sm font-medium"
          style={{
            color: colorPair.text,
            paddingTop: `${paddingV}px`,
            paddingLeft: "12px",
            paddingRight: "12px",
          }}
          value={localLabel}
          onChange={handleChange}
          onBlur={stopEditing}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Label"
        />
      ) : (
        <span
          className="relative z-10 truncate px-3 text-sm font-medium"
          style={{ color: colorPair.text, opacity: data.label ? 1 : 0.4 }}
        >
          {data.label || "Label"}
        </span>
      )}
    </div>
  );
});
