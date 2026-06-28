import { task, logger } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { getLiveblocks } from "@/lib/liveblocks";
import { NODE_SHAPES, NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

const AI_USER_ID = "ghost-ai";
const AI_COLOR = "#6457f9";

const nodeOutputSchema = z.object({
  id: z.string(),
  label: z.string(),
  shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]),
  colorIndex: z.number().int().min(0).max(7),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const nodeUpdateSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]).nullable(),
  colorIndex: z.number().int().min(0).max(7).nullable(),
  x: z.number().nullable(),
  y: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});

const edgeOutputSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().nullable(),
});

const designOutputSchema = z.object({
  nodesToAdd: z.array(nodeOutputSchema),
  nodesToUpdate: z.array(nodeUpdateSchema),
  nodeIdsToDelete: z.array(z.string()),
  edgesToAdd: z.array(edgeOutputSchema),
  edgeIdsToDelete: z.array(z.string()),
  summary: z.string(),
});

type DesignOutput = z.infer<typeof designOutputSchema>;

async function setAiPresence(roomId: string, thinking: boolean) {
  try {
    await getLiveblocks().setPresence(roomId, {
      userId: AI_USER_ID,
      data: { cursor: null, thinking },
      userInfo: { name: "Ghost AI", avatar: "", color: AI_COLOR },
      ttl: thinking ? 300 : 5,
    });
  } catch (err) {
    logger.warn("Failed to set AI presence", { err });
  }
}

async function broadcastStatus(
  roomId: string,
  phase: "start" | "thinking" | "writing" | "complete" | "error",
  message: string
) {
  try {
    await getLiveblocks().broadcastEvent(roomId, { type: "ai-status", phase, message });
  } catch (err) {
    logger.warn("Failed to broadcast AI status", { err });
  }
}

function buildSystemPrompt(existingNodes: CanvasNode[], existingEdges: CanvasEdge[]): string {
  const shapeList = NODE_SHAPES.map((s) => `${s.shape} (default ${s.width}x${s.height})`).join(", ");
  const colorList = NODE_COLORS.map((c, i) => `${i}: fill ${c.fill} / text ${c.text}`).join(", ");

  const existingContext =
    existingNodes.length > 0
      ? `Existing nodes: ${JSON.stringify(
          existingNodes.map((n) => ({
            id: n.id,
            label: n.data.label,
            shape: n.data.shape,
            x: Math.round(n.position.x),
            y: Math.round(n.position.y),
          }))
        )}`
      : "Canvas is currently empty.";

  return `You are Ghost AI, an expert system architecture designer. Generate or modify a system architecture diagram on a canvas.

Available shapes: ${shapeList}
Available color indices (0-7): ${colorList}

Layout rules:
- Space nodes at least 40px apart
- Use a grid-like layout: left-to-right or top-to-bottom flow
- Place services/components logically grouped
- Keep x/y values in the range 0-1200 for horizontal and 0-800 for vertical
- Match node dimensions to the shape defaults unless a different size makes semantic sense

Node naming: concise, clear service/component names (e.g. "API Gateway", "Auth Service", "PostgreSQL")

Edge rules:
- Edge IDs should be "{source}-{target}"
- Only add edges between existing node IDs (including newly added ones)
- Keep labels short (e.g. "HTTP", "gRPC", "SQL")

${existingContext}`;
}

async function applyDesign(
  roomId: string,
  design: DesignOutput
): Promise<void> {
  const liveblocks = getLiveblocks();

  await mutateFlow<CanvasNode, CanvasEdge>(
    { client: { mutateStorage: liveblocks.mutateStorage.bind(liveblocks) }, roomId },
    (flow) => {
      for (const id of design.nodeIdsToDelete) {
        flow.removeNode(id);
      }
      for (const id of design.edgeIdsToDelete) {
        flow.removeEdge(id);
      }

      for (const n of design.nodesToAdd) {
        const shapeConfig = NODE_SHAPES.find((s) => s.shape === n.shape) ?? NODE_SHAPES[0];
        const color = NODE_COLORS[n.colorIndex] ?? NODE_COLORS[0];
        flow.addNode({
          id: n.id,
          type: "canvasNode",
          position: { x: n.x, y: n.y },
          data: { label: n.label, color: color.fill, shape: n.shape },
          width: n.width ?? shapeConfig.width,
          height: n.height ?? shapeConfig.height,
        });
      }

      for (const u of design.nodesToUpdate) {
        const existing = flow.nodes.find((node) => node.id === u.id);
        if (!existing) continue;

        const updatedPosition =
          u.x !== null || u.y !== null
            ? {
                x: u.x ?? existing.position.x,
                y: u.y ?? existing.position.y,
              }
            : undefined;

        if (updatedPosition) {
          flow.updateNode(u.id, { position: updatedPosition });
        }

        const dataUpdate: Partial<{ label: string; color: string; shape: string }> = {};
        if (u.label !== null) dataUpdate.label = u.label;
        if (u.shape !== null) dataUpdate.shape = u.shape;
        if (u.colorIndex !== null) {
          const newColor = NODE_COLORS[u.colorIndex]?.fill;
          if (newColor) dataUpdate.color = newColor;
        }

        if (Object.keys(dataUpdate).length > 0) {
          flow.updateNodeData(u.id, dataUpdate);
        }

        if (u.width !== null || u.height !== null) {
          flow.updateNode(u.id, {
            width: u.width ?? existing.width,
            height: u.height ?? existing.height,
          });
        }
      }

      for (const e of design.edgesToAdd) {
        flow.addEdge({
          id: e.id,
          type: "canvasEdge",
          source: e.source,
          target: e.target,
          data: e.label !== null ? { label: e.label } : {},
        });
      }
    }
  );
}

export const designAgentTask = task({
  id: "design-agent",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;

    logger.info("Design agent task started", { roomId, prompt });

    await setAiPresence(roomId, true);
    await broadcastStatus(roomId, "start", "Ghost AI is starting...");

    let existingNodes: CanvasNode[] = [];
    let existingEdges: CanvasEdge[] = [];

    try {
      const liveblocks = getLiveblocks();
      await mutateFlow<CanvasNode, CanvasEdge>(
        { client: { mutateStorage: liveblocks.mutateStorage.bind(liveblocks) }, roomId },
        (flow) => {
          existingNodes = [...flow.nodes];
          existingEdges = [...flow.edges];
        }
      );
    } catch (err) {
      logger.warn("Could not read existing canvas state", { err });
    }

    await broadcastStatus(roomId, "thinking", "Thinking about your design...");

    let design: DesignOutput;
    try {
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: designOutputSchema,
        system: buildSystemPrompt(existingNodes, existingEdges),
        prompt,
      });
      design = object;
    } catch (err) {
      logger.error("Failed to generate design", { err });
      await broadcastStatus(roomId, "error", "Failed to generate design. Please try again.");
      await setAiPresence(roomId, false);
      throw err;
    }

    logger.info("Design generated", {
      nodesToAdd: design.nodesToAdd.length,
      nodesToUpdate: design.nodesToUpdate.length,
      nodeIdsToDelete: design.nodeIdsToDelete.length,
      edgesToAdd: design.edgesToAdd.length,
      edgeIdsToDelete: design.edgeIdsToDelete.length,
    });

    await broadcastStatus(roomId, "writing", "Writing to canvas...");

    try {
      await applyDesign(roomId, design);
    } catch (err) {
      logger.error("Failed to apply design to canvas", { err });
      await broadcastStatus(roomId, "error", "Failed to update canvas. Please try again.");
      await setAiPresence(roomId, false);
      throw err;
    }

    await broadcastStatus(roomId, "complete", design.summary);
    await setAiPresence(roomId, false);

    logger.info("Design agent task complete", { roomId, summary: design.summary });

    return { roomId, summary: design.summary };
  },
});
