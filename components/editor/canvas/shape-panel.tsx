"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Panel } from "@xyflow/react";
import { Square, Diamond, Circle, Pill, Database, Hexagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NODE_SHAPES, type NodeShapeConfig, DEFAULT_NODE_COLOR } from "@/types/canvas";
import { NodeShape } from "./node-shape";

const SHAPE_ICONS: Record<string, LucideIcon> = {
  rectangle: Square,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Database,
  hexagon: Hexagon,
};

let emptyDragImage: HTMLImageElement | null = null;
function getEmptyDragImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!emptyDragImage) {
    emptyDragImage = new Image();
    emptyDragImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
  }
  return emptyDragImage;
}

interface PreviewState {
  config: NodeShapeConfig;
  x: number;
  y: number;
}

export function ShapePanel() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [mounted, setMounted] = useState(false);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onDocDragOver(e: DragEvent) {
      if (!isDraggingRef.current) return;
      setPreview((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
    }
    document.addEventListener("dragover", onDocDragOver);
    return () => document.removeEventListener("dragover", onDocDragOver);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, config: NodeShapeConfig) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ shape: config.shape, width: config.width, height: config.height })
    );
    e.dataTransfer.effectAllowed = "copy";
    const img = getEmptyDragImage();
    if (img) e.dataTransfer.setDragImage(img, 0, 0);
    isDraggingRef.current = true;
    setPreview({ config, x: e.clientX, y: e.clientY });
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setPreview(null);
  }, []);

  return (
    <>
      <Panel position="bottom-center" className="mb-4">
        <div className="flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 shadow-lg">
          {NODE_SHAPES.map((config) => {
            const Icon = SHAPE_ICONS[config.shape];
            return (
              <button
                key={config.shape}
                draggable
                onDragStart={(e) => handleDragStart(e, config)}
                onDragEnd={handleDragEnd}
                title={config.label}
                className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] active:cursor-grabbing"
              >
                {Icon && <Icon className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </Panel>
      {mounted &&
        preview &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: preview.x - preview.config.width / 2,
              top: preview.y - preview.config.height / 2,
              width: preview.config.width,
              height: preview.config.height,
              pointerEvents: "none",
              zIndex: 9999,
              opacity: 0.75,
            }}
          >
            <div className="relative w-full h-full">
              <NodeShape
                shape={preview.config.shape}
                width={preview.config.width}
                height={preview.config.height}
                fill={DEFAULT_NODE_COLOR.fill}
                stroke="var(--accent-primary)"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
