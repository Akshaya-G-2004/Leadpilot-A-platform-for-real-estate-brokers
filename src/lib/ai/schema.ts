// src/lib/ai/schema.ts
import { z } from "zod";

/**
 * Canonical Zod schema for the AI analysis output.
 * All providers (Gemini, Groq) must produce JSON that validates against this.
 * The schema mirrors the specification in the assignment (section 3).
 */
export const analysisSchema = z.object({
  // ----------------------- free‑form text -----------------------
  summary: z.string().max(600),
  customer_intent: z.string(),
  key_requirements: z.array(z.string()).min(3).max(6),
  objections: z.array(z.string()),
  recommended_next_action: z.string(),
  suggested_response: z.string().max(1200),
  detected_language: z.enum(["en"]),
  priority_reason: z.string(), // must not contain hot/warm/cold or numbers – enforced by code later

  // ----------------------- signals (0‑10) -----------------------
  signals: z.object({
    intent_strength: z.number().int().min(0).max(10),
    timeline_urgency: z.number().int().min(0).max(10),
    budget_clarity: z.number().int().min(0).max(10),
    engagement_quality: z.number().int().min(0).max(10),
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
    questions_to_ask: z.array(z.string()).min(3).max(5),
  }),

  // ----------------------- site visit -----------------------
  site_visit: z.object({
    recommended: z.boolean(),
    preferred_day_offsets: z
      .array(z.number().int().min(1).max(14)),
    preferred_time_of_day: z.enum(["morning", "afternoon", "evening"]),
    reason: z.string(),
  }),

  spoken_brief: z.string().max(400),
  whatsapp_message: z.string(),
});

// Export TypeScript type for compile‑time safety.
export type Analysis = z.infer<typeof analysisSchema>;

