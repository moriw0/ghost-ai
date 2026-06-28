"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useMutation, useUndo, useRedo, useUpdateMyPresence, useEventListener } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { DEFAULT_NODE_COLOR } from "@/types/canvas";
import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { ControlBar } from "./control-bar";
import { LiveCursors } from "./live-cursors";
import { PresenceAvatars } from "./presence-avatars";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { type CanvasTemplate } from "@/components/editor/starter-templates";
import { Panel } from "@xyflow/react";
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

function SaveStatusIndicator({ status }: { status: ReturnType<typeof useCanvasAutosave>["status"] }) {
  if (status === "idle") return null;

  const label =
    status === "saving"
      ? "Saving..."
      : status === "saved"
      ? "Saved"
      : "Save failed";

  const color =
    status === "error"
      ? "text-[var(--status-error,#f87171)]"
      : "text-[var(--text-muted)]";

  return (
    <span className={`text-xs ${color} select-none`}>
      {label}
    </span>
  );
}

interface FlowCanvasProps {
  projectId: string;
  templatesOpen: boolean;
  onTemplatesClose: () => void;
}

function AiStatusBanner({ message, phase }: { message: string; phase: string }) {
  const isError = phase === "error";
  const isComplete = phase === "complete";
  const color = isError
    ? "border-red-500/30 bg-red-900/20 text-red-300"
    : isComplete
    ? "border-[var(--accent-ai)]/30 bg-[var(--accent-ai)]/10 text-[var(--accent-ai-text)]"
    : "border-[var(--accent-ai)]/30 bg-[var(--accent-ai)]/10 text-[var(--accent-ai-text)]";
  return (
    <div
      className={`pointer-events-none rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm ${color}`}
    >
      {isComplete || isError ? message : `${message}`}
    </div>
  );
}

export function FlowCanvas({ projectId, templatesOpen, onTemplatesClose }: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const nodeCounter = useRef(0);
  const flowInstance = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<CanvasTemplate | null>(null);
  const [loadComplete, setLoadComplete] = useState(() => nodes.length > 0 || edges.length > 0);
  const hasCheckedRef = useRef(false);

  const undo = useUndo();
  const redo = useRedo();
  const updateMyPresence = useUpdateMyPresence();

  const [aiStatus, setAiStatus] = useState<{ message: string; phase: string } | null>(null);
  const aiStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return;
    setAiStatus({ message: event.message, phase: event.phase });
    if (aiStatusTimerRef.current) clearTimeout(aiStatusTimerRef.current);
    if (event.phase === "complete" || event.phase === "error") {
      aiStatusTimerRef.current = setTimeout(() => setAiStatus(null), 4000);
    }
  });

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

  const writeToStorage = useMutation(
    ({ storage }, data: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => {
      const flow = storage.get("flow");
      const nodesMap = flow.get("nodes");
      const edgesMap = flow.get("edges");

      for (const node of data.nodes) {
        nodesMap.set(
          node.id,
          new LiveObject({
            id: node.id,
            type: "canvasNode" as const,
            position: node.position,
            data: {
              label: (node.data?.label as string) ?? "",
              color: (node.data?.color as string | undefined) ?? DEFAULT_NODE_COLOR.fill,
              shape: (node.data?.shape as string | undefined) ?? "rectangle",
            },
            width: node.width ?? 120,
            height: node.height ?? 70,
          }) as never
        );
      }

      for (const edge of data.edges) {
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

  // On mount: if the room is empty and a saved canvas exists, restore it from the API.
  // Skipped if the room already has active nodes or edges to protect live collaboration.
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (nodes.length > 0 || edges.length > 0) {
      return;
    }

    let cancelled = false;
    fetch(`/api/projects/${projectId}/canvas`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 204) {
          setLoadComplete(true);
          return;
        }
        if (!res.ok) {
          return;
        }
        const data = await res.json() as { nodes: CanvasNode[]; edges: CanvasEdge[] };
        if (cancelled) return;
        if ((data.nodes?.length ?? 0) > 0 || (data.edges?.length ?? 0) > 0) {
          writeToStorage(data);
          setTimeout(() => {
            flowInstance.current?.fitView({ padding: 0.15, duration: 500 });
          }, 150);
        }
        setLoadComplete(true);
      })
      .catch(() => {
        if (!cancelled) setLoadComplete(true);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status: saveStatus } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: loadComplete,
  });

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!flowInstance.current) return;
      const position = flowInstance.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      updateMyPresence({ cursor: position });
    },
    [updateMyPresence]
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

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
        onPaneMouseMove={handleMouseMove}
        onPaneMouseLeave={handleMouseLeave}
        fitView
      >
        <ControlBar />
        <ShapePanel />
        <KeyboardShortcutsHandler undo={undo} redo={redo} />
        <Panel position="top-right">
          <PresenceAvatars />
        </Panel>
        <Panel position="top-left">
          <div className="flex flex-col items-start gap-1.5">
            <SaveStatusIndicator status={saveStatus} />
            {aiStatus && (
              <AiStatusBanner message={aiStatus.message} phase={aiStatus.phase} />
            )}
          </div>
        </Panel>
        <LiveCursors />
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
