import { schemaTask, metadata, logger } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const nodeDataSchema = z.object({
  label: z.string(),
  shape: z.string().optional(),
  color: z.string().optional(),
}).passthrough();

const nodeSchema = z.object({
  id: z.string(),
  data: nodeDataSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
}).passthrough();

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ label: z.string().optional() }).passthrough().optional(),
}).passthrough();

const specInputSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

type SpecInput = z.infer<typeof specInputSchema>;
type ChatMessage = z.infer<typeof chatMessageSchema>;
type CanvasNode = z.infer<typeof nodeSchema>;
type CanvasEdge = z.infer<typeof edgeSchema>;

function buildSystemPrompt(): string {
  return `You are Ghost AI, a technical documentation specialist. Your task is to generate a comprehensive Markdown technical specification from a system architecture diagram and conversation context.

The specification should follow this structure:

# [Project Name] — Technical Specification

## Overview
Brief summary of the system.

## Architecture
High-level description of the architecture and its design rationale.

## Components
For each node/component in the diagram:
### [Component Name]
- **Type**: service / database / queue / gateway / etc.
- **Responsibilities**: What this component does
- **Connections**: How it communicates with other components

## Data Flow
Key data flows and interactions between components.

## Key Design Decisions
Notable architectural choices and their trade-offs.

## Implementation Notes
Technical considerations for implementing this system.

---

Write clearly and concisely. Use Markdown formatting throughout. Do not include raw JSON or implementation code unless specifically relevant. Focus on the architectural intent.`;
}

function buildUserPrompt(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  chatHistory: ChatMessage[]
): string {
  const nodeList = nodes
    .map((n) => {
      const shape = n.data.shape ? ` (${n.data.shape})` : "";
      return `- ${n.data.label}${shape} [id: ${n.id}]`;
    })
    .join("\n");

  const edgeList = edges
    .map((e) => {
      const label = e.data?.label ? ` — "${e.data.label}"` : "";
      const sourceNode = nodes.find((n) => n.id === e.source);
      const targetNode = nodes.find((n) => n.id === e.target);
      const sourceName = sourceNode?.data.label ?? e.source;
      const targetName = targetNode?.data.label ?? e.target;
      return `- ${sourceName} → ${targetName}${label}`;
    })
    .join("\n");

  const chatContext =
    chatHistory.length > 0
      ? chatHistory
          .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
          .join("\n")
      : "No conversation history available.";

  return `Generate a technical specification for the following system architecture.

## Canvas Components (${nodes.length} nodes)
${nodeList || "No components on canvas."}

## Connections (${edges.length} edges)
${edgeList || "No connections defined."}

## Conversation Context
${chatContext}

Generate the complete Markdown specification now.`;
}

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: specInputSchema,
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: SpecInput) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    logger.info("Spec generation started", {
      projectId,
      roomId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      chatHistoryLength: chatHistory.length,
    });

    metadata.set("status", "starting").set("progress", 0);

    const userPrompt = buildUserPrompt(nodes, edges, chatHistory);

    metadata.set("status", "generating").set("progress", 20);

    let specContent: string;
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: buildSystemPrompt(),
        prompt: userPrompt,
      });
      specContent = text;
    } catch (err) {
      logger.error("Failed to generate spec with Gemini", { err });
      metadata.set("status", "error").set("progress", 0);
      throw err;
    }

    metadata.set("status", "complete").set("progress", 100);

    logger.info("Spec generation complete", {
      projectId,
      specLength: specContent.length,
    });

    return { specContent };
  },
});
