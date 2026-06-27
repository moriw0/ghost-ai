"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NODE_COLORS } from "@/types/canvas";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

const PREVIEW_W = 280;
const PREVIEW_H = 160;
const PREVIEW_PAD = 12;

interface StarterTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl bg-[var(--bg-surface)] border-[var(--border-default)] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[var(--border-default)]">
          <DialogTitle className="text-[var(--text-primary)]">
            Starter Templates
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={onImport}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateCardProps {
  template: CanvasTemplate;
  onImport: (template: CanvasTemplate) => void;
}

function TemplateCard({ template, onImport }: TemplateCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden">
      <div
        className="bg-[var(--bg-base)] flex items-center justify-center"
        style={{ width: PREVIEW_W, height: PREVIEW_H }}
      >
        <DiagramPreview nodes={template.nodes} edges={template.edges} />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {template.name}
        </p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {template.description}
        </p>
        <Button
          size="sm"
          className="mt-1 w-full"
          onClick={() => onImport(template)}
        >
          Import
        </Button>
      </div>
    </div>
  );
}

function getNodeColor(fillColor: string | undefined) {
  return NODE_COLORS.find((c) => c.fill === fillColor) ?? NODE_COLORS[0];
}

interface DiagramPreviewProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function DiagramPreview({ nodes, edges }: DiagramPreviewProps) {
  if (nodes.length === 0) return null;

  // Compute bounding box from node positions + dimensions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    const w = node.width ?? 120;
    const h = node.height ?? 70;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const availW = PREVIEW_W - PREVIEW_PAD * 2;
  const availH = PREVIEW_H - PREVIEW_PAD * 2;
  const scale = Math.min(availW / contentW, availH / contentH, 1);

  // After scaling, center the content in the viewport
  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const offsetX = PREVIEW_PAD + (availW - scaledW) / 2;
  const offsetY = PREVIEW_PAD + (availH - scaledH) / 2;

  function toViewport(x: number, y: number) {
    return {
      x: (x - minX) * scale + offsetX,
      y: (y - minY) * scale + offsetY,
    };
  }

  // Build node center lookup for edge rendering
  const centerMap: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    const w = node.width ?? 120;
    const h = node.height ?? 70;
    const { x, y } = toViewport(node.position.x + w / 2, node.position.y + h / 2);
    centerMap[node.id] = { x, y };
  }

  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Edges */}
      {edges.map((edge) => {
        const src = centerMap[edge.source];
        const tgt = centerMap[edge.target];
        if (!src || !tgt) return null;
        return (
          <line
            key={edge.id}
            x1={src.x}
            y1={src.y}
            x2={tgt.x}
            y2={tgt.y}
            stroke="var(--border-default)"
            strokeWidth="1"
            strokeOpacity="0.8"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const w = (node.width ?? 120) * scale;
        const h = (node.height ?? 70) * scale;
        const { x, y } = toViewport(node.position.x, node.position.y);
        const colors = getNodeColor(node.data.color as string | undefined);
        const shape = (node.data.shape as string | undefined) ?? "rectangle";

        return (
          <NodePreviewShape
            key={node.id}
            x={x}
            y={y}
            w={w}
            h={h}
            shape={shape}
            fill={colors.fill}
            stroke={colors.text}
          />
        );
      })}
    </svg>
  );
}

interface NodePreviewShapeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  shape: string;
  fill: string;
  stroke: string;
}

function NodePreviewShape({ x, y, w, h, shape, fill, stroke }: NodePreviewShapeProps) {
  const strokeWidth = 0.75;

  if (shape === "circle") {
    return (
      <ellipse
        cx={x + w / 2}
        cy={y + h / 2}
        rx={w / 2}
        ry={h / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (shape === "diamond") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const pts = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
    return (
      <polygon
        points={pts}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (shape === "hexagon") {
    const cx = x + w / 2;
    const pts = [
      `${cx},${y}`,
      `${x + w},${y + h * 0.25}`,
      `${x + w},${y + h * 0.75}`,
      `${cx},${y + h}`,
      `${x},${y + h * 0.75}`,
      `${x},${y + h * 0.25}`,
    ].join(" ");
    return (
      <polygon
        points={pts}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (shape === "cylinder") {
    const ry = Math.max(3, h * 0.18);
    const rx = w / 2;
    return (
      <g>
        <rect
          x={x}
          y={y + ry}
          width={w}
          height={h - ry * 2}
          fill={fill}
          stroke="none"
        />
        <line x1={x} y1={y + ry} x2={x} y2={y + h - ry} stroke={stroke} strokeWidth={strokeWidth} />
        <line x1={x + w} y1={y + ry} x2={x + w} y2={y + h - ry} stroke={stroke} strokeWidth={strokeWidth} />
        <ellipse cx={x + rx} cy={y + h - ry} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <ellipse cx={x + rx} cy={y + ry} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </g>
    );
  }

  // rectangle + pill
  const rx = shape === "pill" ? h / 2 : 3;
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}
