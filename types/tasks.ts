import { z } from "zod";

export const aiStatusMessageSchema = z.object({
  text: z.string().nullish(),
});

export type AiStatusMessage = z.infer<typeof aiStatusMessageSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
