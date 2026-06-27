"use client";

import { Panel } from "@xyflow/react";
import { Square, Diamond, Circle, Pill, Database, Hexagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NODE_SHAPES, type NodeShapeConfig } from "@/types/canvas";

const SHAPE_ICONS: Record<string, LucideIcon> = {
  rectangle: Square,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Database,
  hexagon: Hexagon,
};

export function ShapePanel() {
  function handleDragStart(e: React.DragEvent, config: NodeShapeConfig) {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ shape: config.shape, width: config.width, height: config.height })
    );
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <Panel position="bottom-center" className="mb-4">
      <div className="flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 shadow-lg">
        {NODE_SHAPES.map((config) => {
          const Icon = SHAPE_ICONS[config.shape];
          return (
            <button
              key={config.shape}
              draggable
              onDragStart={(e) => handleDragStart(e, config)}
              title={config.label}
              className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] active:cursor-grabbing"
            >
              {Icon && <Icon className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
