import type { LiveList, LiveObject } from "@liveblocks/client";
import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import type { ChatMessage } from "@/types/tasks";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>;
      aiStatusFeed: LiveObject<{ text: string | null }>;
      aiChatFeed: LiveList<LiveObject<ChatMessage>>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent: {
      type: "ai-status";
      message: string;
      phase: "start" | "thinking" | "writing" | "complete" | "error";
    };

    ThreadMetadata: {};

    RoomInfo: {};
  }
}

export {};
