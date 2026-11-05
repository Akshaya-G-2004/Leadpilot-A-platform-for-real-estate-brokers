// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { seedLeads } from "@/lib/seed";
import { chatMessageSchema } from "@/lib/ai/chatSchema";
import type { ChatMessage } from "@/lib/ai/chatSchema";

// ── Request schema ────────────────────────────────────────────────────────────
const RequestSchema = z.object({
  leadId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildSystemPrompt(lead: (typeof seedLeads)[0]): string {
  const a = lead.analysis_json;
  return `You are LeadPilot, an AI assistant helping a real-estate sales agent.

You have access to the following lead record:

Name: ${lead.name}
Phone: ${lead.phone ?? "Not provided"}
Location: ${lead.location}
Property requirement: ${lead.property_requirement}
Budget: ${lead.budget}
Timeline: ${lead.timeline}
Original message: ${lead.message}
Score: ${lead.score}/100  Tag: ${lead.tag.toUpperCase()}
Readiness: ${lead.readiness_pct}%

${
  a
    ? `Analysis summary: ${a.summary}
Customer intent: ${a.customer_intent}
Key requirements: ${a.key_requirements.join(", ")}
Objections: ${a.objections.join(", ") || "None"}
Recommended next action: ${a.recommended_next_action}
Suggested response: ${a.suggested_response}
Priority reason: ${a.priority_reason}`
    : "No analysis available yet."
}

RULES:
- Answer ONLY about this lead and general real-estate advice.
- Do NOT invent property names, prices, or availability.
- Keep replies concise (under 300 words).
- Reply in plain text — no markdown headers, no bullet symbols.
- If you don't know something, say so honestly.`;
}

// ── Gemini call ───────────────────────────────────────────────────────────────
async function callGemini(
  systemPrompt: string,
  history: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  // Build contents array for Gemini API
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty text");
  return text.trim();
}

// ── Groq fallback ─────────────────────────────────────────────────────────────
async function callGroq(
  systemPrompt: string,
  history: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const model = process.env.GROQ_MODEL ?? "llama3-8b-8192";
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 512 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Groq returned empty text");
  return text.trim();
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parse & validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { leadId, message, history } = parsed.data;

  // 2. Load lead
  const lead = seedLeads.find((l) => l.id === leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // 3. Build system prompt
  const systemPrompt = buildSystemPrompt(lead);

  // 4. Call AI (Groq first, Gemini fallback)
  let assistantText: string;
  let provider: "gemini" | "groq" | "error";

  try {
    assistantText = await callGroq(systemPrompt, history, message);
    provider = "groq";
  } catch (groqErr) {
    console.warn("[chat] Groq failed, trying Gemini:", groqErr);
    try {
      assistantText = await callGemini(systemPrompt, history, message);
      provider = "gemini";
    } catch (geminiErr) {
      const groqMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
      const geminiMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      console.error("[chat] Groq error:", groqMsg);
      console.error("[chat] Gemini error:", geminiMsg);
      return NextResponse.json(
        { error: `Groq: ${groqMsg} | Gemini: ${geminiMsg}` },
        { status: 503 }
      );
    }
  }

  // 5. Build validated message objects
  const now = new Date().toISOString();

  const userMsg: ChatMessage = chatMessageSchema.parse({
    id: uuidv4(),
    lead_id: leadId,
    role: "user",
    content: message,
    created_at: now,
  });

  const assistantMsg: ChatMessage = chatMessageSchema.parse({
    id: uuidv4(),
    lead_id: leadId,
    role: "assistant",
    content: assistantText,
    created_at: new Date().toISOString(),
  });

  // 6. Return both messages + provider info
  return NextResponse.json({
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    provider,
  });
}

