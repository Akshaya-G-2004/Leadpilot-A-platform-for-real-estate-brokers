// src/lib/ai/schema.ts
import { z } from "zod";

/**
 * Canonical Zod schema for the AI analysis output.
 * All providers (Gemini, Groq) must produce JSON that validates against this.
 * The schema mirrors the specification in the assignment (section 3).
 */
export const analysisSchema = z.object({
  // ----------------------- free‑form text -----------------------
  summary: z.string().max(1000),
  customer_intent: z.string(),
  key_requirements: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  recommended_next_action: z.string(),
  suggested_response: z.string().max(2000),
  detected_language: z.literal("en").catch("en").default("en"),
  priority_reason: z.string().default("Direct inquiry with buyer requirements."),

  // ----------------------- signals (0‑10) -----------------------
  signals: z.object({
    intent_strength: z.number().min(0).max(10).default(7),
    timeline_urgency: z.number().min(0).max(10).default(6),
    budget_clarity: z.number().min(0).max(10).default(7),
    engagement_quality: z.number().min(0).max(10).default(7),
  }),

  // ----------------------- readiness -----------------------
  readiness: z.object({
    budget: z.object({
      status: z.enum(["clear", "vague", "missing"]),
      note: z.string(),
    }),
    location: z.object({
      status: z.enum(["clear", "vague", "missing"]),
      note: z.string(),
    }),
    property_type: z.object({
      status: z.enum(["clear", "vague", "missing"]),
      note: z.string(),
    }),
    timeline: z.object({
      status: z.enum(["clear", "vague", "missing"]),
      note: z.string(),
    }),
    decision_maker: z.object({
      status: z.enum(["clear", "vague", "missing"]),
      note: z.string(),
    }),
    questions_to_ask: z.array(z.string()).default([]),
  }),

  // ----------------------- site visit -----------------------
  site_visit: z.object({
    recommended: z.boolean().default(true),
    preferred_day_offsets: z.array(z.number()).default([2, 4]),
    preferred_time_of_day: z.enum(["morning", "afternoon", "evening"]).catch("morning").default("morning"),
    reason: z.string().default("Follow up with buyer to confirm visit."),
  }),

  spoken_brief: z.string().max(600).default(""),
  whatsapp_message: z.string().default(""),
});

// Export TypeScript type for compile‑time safety.
export type Analysis = z.infer<typeof analysisSchema>;

