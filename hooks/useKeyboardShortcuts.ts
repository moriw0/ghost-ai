"use client";

import { useEffect } from "react";
import type { Node, Edge, ReactFlowInstance } from "@xyflow/react";

interface UseKeyboardShortcutsProps<N extends Node = Node, E extends Edge = Edge> {
  instance: ReactFlowInstance<N, E> | null;
  undo: () => void;
  redo: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

export function useKeyboardShortcuts<N extends Node = Node, E extends Edge = Edge>({
  instance,
  undo,
  redo,
}: UseKeyboardShortcutsProps<N, E>) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      const key = e.key.toLowerCase();
      const meta = e.metaKey || e.ctrlKey;

      if (!meta && (key === "+" || key === "=")) {
        e.preventDefault();
        instance?.zoomIn({ duration: 300 });
      } else if (!meta && key === "-") {
        e.preventDefault();
        instance?.zoomOut({ duration: 300 });
      } else if (meta && !e.shiftKey && key === "z") {
        e.preventDefault();
        undo();
      } else if (meta && e.shiftKey && key === "z") {
        e.preventDefault();
        redo();
      } else if (meta && key === "y") {
        e.preventDefault();
        redo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [instance, undo, redo]);
}
