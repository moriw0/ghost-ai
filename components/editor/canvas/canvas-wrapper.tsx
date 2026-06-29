"use client";

import { Component, type ReactNode } from "react";
import { ClientSideSuspense } from "@liveblocks/react";
import { FlowCanvas } from "./flow-canvas";

interface CanvasWrapperProps {
  projectId: string;
  templatesOpen: boolean;
  onTemplatesClose: () => void;
}

export function CanvasWrapper({ projectId, templatesOpen, onTemplatesClose }: CanvasWrapperProps) {
  return (
    <CanvasErrorBoundary>
      <ClientSideSuspense fallback={<CanvasLoading />}>
        <FlowCanvas
          projectId={projectId}
          templatesOpen={templatesOpen}
          onTemplatesClose={onTemplatesClose}
        />
      </ClientSideSuspense>
    </CanvasErrorBoundary>
  );
}

function CanvasLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-[var(--text-muted)]">Loading canvas...</p>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">
            Could not connect to the canvas. Please refresh and try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
