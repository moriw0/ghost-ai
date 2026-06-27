"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  useReactFlow,
  type ReactFlowInstance,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useMutation, useUndo, useRedo } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { ControlBar } from "./control-bar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { type CanvasTemplate } from "@/components/editor/starter-templates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ShapeDragPayload {
  shape: string;
  width: number;
  height: number;
}

function KeyboardShortcutsHandler({ undo, redo }: { undo: () => void; redo: () => void }) {
  const instance = useReactFlow<CanvasNode, CanvasEdge>();
  useKeyboardShortcuts({ instance, undo, redo });
  return null;
}

const nodeTypes = {
  canvasNode: CanvasNodeComponent,
};

const edgeTypes = {
  canvasEdge: CanvasEdgeComponent,
};

interface FlowCanvasProps {
  templatesOpen: boolean;
  onTemplatesClose: () => void;
}

export function FlowCanvas({ templatesOpen, onTemplatesClose }: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const nodeCounter = useRef(0);
  const flowInstance = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<CanvasTemplate | null>(null);

  const undo = useUndo();
  const redo = useRedo();

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

  // Custom onConnect writes edges with type "canvasEdge" so the custom renderer is used.
  // useLiveblocksFlow's onConnect does not apply defaultEdgeOptions, so we manage edge
  // creation directly via mutation.
  const handleConnect = useMutation(
    ({ storage }, connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const edgeId = `${connection.source}-${connection.sourceHandle ?? ""}-${connection.target}-${connection.targetHandle ?? ""}`;
      const edgesMap = storage.get("flow").get("edges");
      edgesMap.set(
        edgeId,
        new LiveObject({
          id: edgeId,
          type: "canvasEdge" as const,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle ?? null,
          targetHandle: connection.targetHandle ?? null,
          data: {},
        }) as never
      );
    },
    []
  );

  const loadTemplate = useMutation(
    ({ storage }, template: CanvasTemplate) => {
      const flow = storage.get("flow");
      const nodesMap = flow.get("nodes");
      const edgesMap = flow.get("edges");

      Array.from(nodesMap.keys()).forEach((key) => nodesMap.delete(key));
      Array.from(edgesMap.keys()).forEach((key) => edgesMap.delete(key));

      for (const node of template.nodes) {
        nodesMap.set(
          node.id,
          new LiveObject({
            id: node.id,
            type: "canvasNode" as const,
            position: node.position,
            data: {
              label: (node.data.label as string) ?? "",
              color: (node.data.color as string | undefined) ?? DEFAULT_NODE_COLOR.fill,
              shape: (node.data.shape as string | undefined) ?? "rectangle",
            },
            width: node.width ?? 120,
            height: node.height ?? 70,
          }) as never
        );
      }

      for (const edge of template.edges) {
        edgesMap.set(
          edge.id,
          new LiveObject({
            id: edge.id,
            type: "canvasEdge" as const,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
            data: { label: (edge.data?.label as string | undefined) ?? undefined },
          }) as never
        );
      }
    },
    []
  );

  const applyTemplate = useCallback(
    (template: CanvasTemplate) => {
      loadTemplate(template);
      onTemplatesClose();
      setPendingTemplate(null);
      setTimeout(() => {
        flowInstance.current?.fitView({ padding: 0.15, duration: 500 });
      }, 150);
    },
    [loadTemplate, onTemplatesClose]
  );

  const handleTemplateImport = useCallback(
    (template: CanvasTemplate) => {
      if (nodes.length > 0) {
        setPendingTemplate(template);
      } else {
        applyTemplate(template);
      }
    },
    [nodes.length, applyTemplate]
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
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
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
        <ControlBar />
        <ShapePanel />
        <KeyboardShortcutsHandler undo={undo} redo={redo} />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
      <StarterTemplatesModal
        open={templatesOpen}
        onClose={onTemplatesClose}
        onImport={handleTemplateImport}
      />
      <Dialog
        open={pendingTemplate !== null}
        onOpenChange={(open) => { if (!open) setPendingTemplate(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace canvas?</DialogTitle>
            <DialogDescription>
              Loading this template will permanently clear all existing nodes and
              edges. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTemplate(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (pendingTemplate) applyTemplate(pendingTemplate); }}
            >
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
