"use client";

import { useReactFlow, Panel } from "@xyflow/react";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ZOOM_DURATION = 300;

export function ControlBar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <Panel position="bottom-left" className="mb-4 ml-4">
      <div className="flex items-center gap-0.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1.5 shadow-lg">
        <ControlButton onClick={() => zoomOut({ duration: ZOOM_DURATION })} title="Zoom out (−)">
          <ZoomOut className="h-4 w-4" />
        </ControlButton>
        <ControlButton onClick={() => fitView({ duration: ZOOM_DURATION })} title="Fit view">
          <Maximize2 className="h-4 w-4" />
        </ControlButton>
        <ControlButton onClick={() => zoomIn({ duration: ZOOM_DURATION })} title="Zoom in (+)">
          <ZoomIn className="h-4 w-4" />
        </ControlButton>

        <div className="mx-1.5 h-4 w-px bg-[var(--border-default)]" />

        <ControlButton onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
          <Undo2 className="h-4 w-4" />
        </ControlButton>
        <ControlButton onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)">
          <Redo2 className="h-4 w-4" />
        </ControlButton>
      </div>
    </Panel>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ControlButton({ onClick, disabled = false, title, children }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40 text-[var(--text-secondary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] cursor-pointer"
      )}
    >
      {children}
    </button>
  );
}
