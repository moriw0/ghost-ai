import type { Node, Edge } from "@xyflow/react";

export interface CanvasNodeData {
  label: string;
  color?: string;
  shape?: string;
  [key: string]: unknown;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge<Record<string, never>, "canvasEdge">;

export interface NodeShapeConfig {
  shape: string;
  label: string;
  width: number;
  height: number;
}

export const NODE_SHAPES: NodeShapeConfig[] = [
  { shape: "rectangle", label: "Rectangle", width: 160, height: 80 },
  { shape: "diamond", label: "Diamond", width: 140, height: 140 },
  { shape: "circle", label: "Circle", width: 80, height: 80 },
  { shape: "pill", label: "Pill", width: 160, height: 60 },
  { shape: "cylinder", label: "Cylinder", width: 100, height: 120 },
  { shape: "hexagon", label: "Hexagon", width: 130, height: 120 },
];

export interface NodeColor {
  fill: string;
  text: string;
}

export const NODE_COLORS: NodeColor[] = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
];

export const DEFAULT_NODE_COLOR: NodeColor = NODE_COLORS[0];
