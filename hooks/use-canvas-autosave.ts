"use client";

import { useEffect, useRef, useState } from "react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled: boolean;
  debounceMs?: number;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  debounceMs = 2000,
}: UseCanvasAutosaveOptions): { status: SaveStatus } {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveVersionRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const version = ++saveVersionRef.current;
      setStatus("saving");
      fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      })
        .then((res) => {
          if (saveVersionRef.current !== version) return;
          if (!res.ok) throw new Error("Save failed");
          setStatus("saved");
        })
        .catch(() => {
          if (saveVersionRef.current !== version) return;
          setStatus("error");
        });
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectId, nodes, edges, enabled, debounceMs]);

  return { status };
}
