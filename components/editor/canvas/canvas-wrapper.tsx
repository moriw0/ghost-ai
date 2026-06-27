"use client";

import { Component, type ReactNode } from "react";
import { LiveObject, LiveMap } from "@liveblocks/client";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { FlowCanvas } from "./flow-canvas";

interface CanvasWrapperProps {
  roomId: string;
  templatesOpen: boolean;
  onTemplatesClose: () => void;
}

export function CanvasWrapper({ roomId, templatesOpen, onTemplatesClose }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
        initialStorage={() => ({
          flow: new LiveObject({
            nodes: new LiveMap(),
            edges: new LiveMap(),
          }),
        })}
      >
        <CanvasErrorBoundary>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <FlowCanvas templatesOpen={templatesOpen} onTemplatesClose={onTemplatesClose} />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
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
