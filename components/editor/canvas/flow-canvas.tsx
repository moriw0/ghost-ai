"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import { CanvasNodeComponent } from "./canvas-node";
import { ShapePanel } from "./shape-panel";

interface ShapeDragPayload {
  shape: string;
  width: number;
  height: number;
}

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
};

const edgeTypes = {};

export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const nodeCounter = useRef(0);
  const flowInstance = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);

  const addCanvasNode = useMutation(
    (
      { storage },
      params: {
        id: string;
        shape: string;
        position: { x: number; y: number };
        width: number;
        height: number;
      }
    ) => {
      const nodesMap = storage.get("flow").get("nodes");
      nodesMap.set(
        params.id,
        new LiveObject({
          id: params.id,
          type: "canvasNode" as const,
          position: params.position,
          data: {
            label: "",
            color: DEFAULT_NODE_COLOR.fill,
            shape: params.shape,
          },
          width: params.width,
          height: params.height,
        }) as never
      );
    },
    []
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!flowInstance.current) return;

      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      const { shape, width, height } = payload;
      if (!shape || typeof width !== "number" || typeof height !== "number") return;

      const position = flowInstance.current.screenToFlowPosition({
        x: e.clientX - width / 2,
        y: e.clientY - height / 2,
      });

      nodeCounter.current += 1;
      const id = `${shape}-${Date.now()}-${nodeCounter.current}`;

      addCanvasNode({ id, shape, position, width, height });
    },
    [addCanvasNode]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionMode={ConnectionMode.Loose}
      onInit={(instance) => {
        flowInstance.current = instance;
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      fitView
    >
      <ShapePanel />
      <MiniMap />
      <Background variant={BackgroundVariant.Dots} />
    </ReactFlow>
  );
}
