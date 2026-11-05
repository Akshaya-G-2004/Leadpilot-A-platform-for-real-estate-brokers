import { z } from "zod";

// Schema for a single chat message stored in the DB
export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  created_at: z.string().datetime(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

