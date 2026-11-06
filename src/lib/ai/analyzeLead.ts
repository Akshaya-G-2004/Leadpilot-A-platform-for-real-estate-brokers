// src/lib/ai/analyzeLead.ts
import { systemPrompt } from "./prompts";
import { analysisSchema, type Analysis } from "./schema";

/**
 * Enforces business domain scoring rubrics on lead signals and readiness.
 * Guarantees that urgent/immediate leads (1-2 weeks) receive high urgency (10/10)
 * and clear readiness status regardless of LLM variance.
 */
export function normalizeLeadSignalsAndReadiness(
  analysis: Analysis,
  timeline?: string,
  message?: string,
  budget?: string,
  property_requirement?: string
): Analysis {
  const combinedText = `${timeline || ""} ${message || ""}`.toLowerCase();

  // Dynamic Property Type Readiness
  if (!property_requirement || property_requirement === "Not Specified" || !property_requirement.trim()) {
    if (analysis.readiness?.property_type) {
      analysis.readiness.property_type.status = "missing";
      analysis.readiness.property_type.note = "BHK / Property type not specified";
    }
  } else if (analysis.readiness?.property_type && analysis.readiness.property_type.status === "missing") {
    analysis.readiness.property_type.status = "clear";
    analysis.readiness.property_type.note = property_requirement;
  }

  // Dynamic Timeline Urgency
  if (!timeline || timeline === "Not Specified" || !timeline.trim()) {
    if (analysis.readiness?.timeline) {
      analysis.readiness.timeline.status = "missing";
      analysis.readiness.timeline.note = "Timeline not specified";
    }
    analysis.signals.timeline_urgency = 5;
    analysis.signals.intent_strength = Math.min(Math.max(analysis.signals.intent_strength || 6, 5), 6);
    analysis.priority_reason = "Customer requirement noted; timeline to be verified on call.";
  } else if (/no rush|next year|exploring|[7-9]\s*month|\d{2,}\s*month|casual|just browsing/i.test(combinedText)) {
    analysis.signals.timeline_urgency = 1;
    analysis.signals.intent_strength = Math.min(analysis.signals.intent_strength || 3, 3);
    analysis.signals.engagement_quality = Math.min(analysis.signals.engagement_quality || 4, 4);
    if (analysis.readiness?.timeline) {
      analysis.readiness.timeline.status = "vague";
      analysis.readiness.timeline.note = timeline || "7+ months / Exploring";
    }
    analysis.priority_reason = "Long-term exploratory inquiry with no immediate purchase urgency.";
  } else if (/immediate|urgent|asap|this week|1-2\s*week|2\s*week|two\s*week/i.test(combinedText)) {
    analysis.signals.timeline_urgency = 10;
    analysis.signals.intent_strength = Math.max(analysis.signals.intent_strength || 0, 9);
    if (analysis.readiness?.timeline) {
      analysis.readiness.timeline.status = "clear";
      analysis.readiness.timeline.note = timeline || "Immediate (1-2 weeks)";
    }
    analysis.priority_reason = "Immediate moving timeline with high purchasing urgency.";
  } else if (/1\s*month|within a month|3\s*week/i.test(combinedText)) {
    analysis.signals.timeline_urgency = 9;
    analysis.signals.intent_strength = Math.max(analysis.signals.intent_strength || 0, 8);
    if (analysis.readiness?.timeline) {
      analysis.readiness.timeline.status = "clear";
    }
    analysis.priority_reason = "Immediate moving timeline with high purchasing urgency.";
  } else if (/2\s*month|within 2 months/i.test(combinedText)) {
    analysis.signals.timeline_urgency = 8;
    analysis.signals.intent_strength = Math.max(analysis.signals.intent_strength || 0, 8);
    if (analysis.readiness?.timeline) {
      analysis.readiness.timeline.status = "clear";
    }
    analysis.priority_reason = "Active pipeline inquiry planning purchase within 2 months.";
  } else if (/3\s*month|4\s*month|5\s*month|6\s*month|diwali|festival|mid year|end of year/i.test(combinedText)) {
    analysis.signals.timeline_urgency = 5;
    analysis.signals.intent_strength = Math.min(Math.max(analysis.signals.intent_strength || 6, 5), 6);
    if (analysis.readiness?.timeline) {
      analysis.readiness.timeline.status = "vague";
      analysis.readiness.timeline.note = timeline || "3 to 6 months";
    }
    analysis.priority_reason = "Planned purchase timeline within 3 to 6 months.";
  }

  // Dynamic Budget Clarity
  const bText = `${budget || ""}`.toLowerCase();
  if (bText && !/flexible|discuss|tbd/i.test(bText)) {
    analysis.signals.budget_clarity = Math.max(analysis.signals.budget_clarity || 0, 8);
    if (analysis.readiness?.budget) {
      analysis.readiness.budget.status = "clear";
    }
  }

  // Ensure priority reason aligns with urgency
  if (analysis.signals.timeline_urgency >= 9) {
    analysis.priority_reason = "Immediate moving timeline with high purchasing urgency.";
  }

  // Dynamic Decision Maker evaluation
  if (/sole buyer|sole decision|decision maker|buying for myself|self-financed|on my own|direct buyer|pre-sanctioned|sole purchaser/i.test(combinedText)) {
    if (analysis.readiness?.decision_maker) {
      analysis.readiness.decision_maker.status = "clear";
      analysis.readiness.decision_maker.note = "Sole decision maker stated in inquiry";
    }
  }

  // Dynamic Recommended Next Action alignment
  if (/do not call|don't call|no calls|whatsapp first|send brochure|send floor plan|send details|share brochure/i.test(combinedText)) {
    analysis.recommended_next_action = "Share project brochures and floor plans via WhatsApp before calling as requested.";
  } else if (/invest|rental yield|roi|capital appreciation/i.test(combinedText)) {
    analysis.recommended_next_action = "Share high-yield investment options and projected rental ROI.";
  } else if (/site visit|visit this weekend|see the flat|inspect|view the property/i.test(combinedText)) {
    analysis.recommended_next_action = "Coordinate immediate site visit and confirm slot with property executive.";
  }

  // Upgrade old generic discovery questions for existing leads
  const isOldGeneric =
    !analysis.readiness?.questions_to_ask ||
    analysis.readiness.questions_to_ask.some((q) =>
      /visit shortlisted properties|What specific amenities or floor preferences/i.test(q)
    );

  if (isOldGeneric && analysis.readiness) {
    analysis.readiness.questions_to_ask = [
      /vastu|east|west|north|south|facing/i.test(combinedText)
        ? "Besides Vastu and direction preference, do you have any specific floor or balcony view requirements?"
        : "Are you looking for a ready-to-move apartment or is an under-construction project acceptable?",
      combinedText && !/bangalore$/i.test(combinedText)
        ? `Any particular tech parks, schools, or landmarks near your preferred location that you want to stay close to?`
        : "Which specific localities or tech corridors in Bangalore are your top priority?",
      analysis.signals.timeline_urgency >= 9
        ? "Given your immediate moving timeline, is your financing or home loan pre-approval already in place?"
        : !budget || /flexible|discuss|tbd/i.test(budget)
        ? "What is your comfortable all-inclusive maximum budget ceiling?"
        : `For your stated budget, are you planning self-financing or exploring home loan options?`,
    ];
  }

  if (analysis.summary) {
    analysis.summary = analysis.summary
      .replace(/\ba\s+not\s+specified\b/gi, "residential property")
      .replace(/\bnot\s+specified\b/gi, "unspecified requirement")
      .replace(/\bwith a budget of Flexible\b/gi, "with a flexible budget");
  }
  if (analysis.customer_intent) {
    analysis.customer_intent = analysis.customer_intent
      .replace(/\babout\s+not\s+specified\b/gi, "about residential property")
      .replace(/\bwith a timeline of Not Specified\b/gi, "with a flexible timeline");
  }

  return analysis;
}

/**
 * Fallback deterministic analysis generator if AI services fail or are offline.
 */
function makeFallbackAnalysis(input: {
  name: string;
  location: string;
  property_requirement: string;
  budget: string;
  timeline: string;
  message: string;
}): Analysis {
  const combinedText = `${input.timeline} ${input.message}`.toLowerCase();

  // Dynamic Timeline Urgency
  let timeline_urgency = 5;
  let intent_strength = 6;
  let engagement_quality = 6;
  let timeline_status: "clear" | "vague" | "missing" = "vague";

  if (!input.timeline || input.timeline === "Not Specified" || !input.timeline.trim()) {
    timeline_urgency = 5;
    intent_strength = 6;
    engagement_quality = 6;
    timeline_status = "missing";
  } else if (/no rush|next year|exploring|[7-9]\s*month|\d{2,}\s*month|casual|just browsing/i.test(combinedText)) {
    timeline_urgency = 1;
    intent_strength = 3;
    engagement_quality = 4;
    timeline_status = "vague";
  } else if (/immediate|urgent|asap|this week|1-2\s*week|2\s*week|two\s*week/i.test(combinedText)) {
    timeline_urgency = 10;
    intent_strength = 9;
    timeline_status = "clear";
  } else if (/1\s*month|within a month/i.test(combinedText)) {
    timeline_urgency = 9;
    intent_strength = 8;
    timeline_status = "clear";
  } else if (/2\s*month|within 2 months/i.test(combinedText)) {
    timeline_urgency = 8;
    intent_strength = 8;
    timeline_status = "clear";
  } else if (/3\s*month|4\s*month|5\s*month|6\s*month|diwali|festival|mid year|end of year/i.test(combinedText)) {
    timeline_urgency = 5;
    intent_strength = 6;
    engagement_quality = 6;
    timeline_status = "vague";
  }

  // Dynamic Budget Clarity
  let budget_clarity = 8;
  let budget_status: "clear" | "vague" | "missing" = "clear";
  if (!input.budget || /flexible|discuss|tbd/i.test(input.budget)) {
    budget_clarity = 5;
    budget_status = "vague";
  }

  const isPropMissing = !input.property_requirement || /not specified|any|flexible|unspecified/i.test(input.property_requirement);
  const isBudgetMissing = !input.budget || /not specified|flexible|discuss|tbd|unspecified/i.test(input.budget);
  const isTimelineMissing = !input.timeline || /not specified|unspecified/i.test(input.timeline);
  const isLocMissing = !input.location || /not specified|unspecified/i.test(input.location) || input.location.trim().toLowerCase() === "bangalore";

  const propSummary = isPropMissing ? "residential property" : `a ${input.property_requirement}`;
  const budgetSummary = isBudgetMissing ? "a flexible budget" : `a budget of ${input.budget}`;
  const timelineSummary = isTimelineMissing ? "a flexible timeline" : `a timeline of ${input.timeline}`;
  const locSummary = isLocMissing ? "in Bangalore" : `in ${input.location}`;

  const baseAnalysis: Analysis = {
    summary: `Customer ${input.name} is looking for ${propSummary} ${locSummary} with ${budgetSummary}.`,
    customer_intent: `Inquiring about ${propSummary} ${locSummary} with ${timelineSummary}.`,
    key_requirements: [
      isPropMissing ? "Residential Property" : input.property_requirement,
      isLocMissing ? "Bangalore" : input.location,
      isBudgetMissing ? "Flexible Budget" : `Budget around ${input.budget}`,
    ],
    objections: [],
    recommended_next_action: /do not call|don't call|no calls|whatsapp first|send brochure|send floor plan|send details|share brochure/i.test(combinedText)
      ? "Share project brochures and floor plans via WhatsApp before calling as requested."
      : /invest|rental yield|roi|capital appreciation/i.test(combinedText)
      ? "Share high-yield investment options and projected rental ROI."
      : /site visit|visit this weekend|see the flat|inspect|view the property/i.test(combinedText)
      ? "Coordinate immediate site visit and confirm slot with property executive."
      : "Call lead to confirm property availability and schedule site visit.",
    suggested_response: `Hi ${input.name}, thanks for reaching out. We have options matching ${propSummary} ${locSummary} with ${budgetSummary}. When is a good time to connect?`,
    detected_language: "en",
    priority_reason: timeline_urgency >= 8
      ? "Immediate moving timeline with high purchasing urgency."
      : timeline_urgency <= 2
      ? "Long-term exploratory inquiry with no immediate purchase urgency."
      : "Planned purchase timeline within 3 to 6 months.",
    signals: {
      intent_strength,
      timeline_urgency,
      budget_clarity,
      engagement_quality,
    },
    readiness: {
      budget: { status: budget_status, note: input.budget },
      location: { status: "clear", note: input.location },
      property_type: {
        status: !input.property_requirement || input.property_requirement === "Not Specified" ? "missing" : "clear",
        note: input.property_requirement || "Not specified",
      },
      timeline: {
        status: !input.timeline || input.timeline === "Not Specified" ? "missing" : timeline_status,
        note: input.timeline || "Not specified",
      },
      decision_maker: /sole buyer|sole decision|decision maker|buying for myself|self-financed|on my own|direct buyer|pre-sanctioned|sole purchaser/i.test(combinedText)
        ? { status: "clear", note: "Sole decision maker stated in inquiry" }
        : { status: "vague", note: "Needs verification during call" },
      questions_to_ask: [
        /vastu|east|west|north|south|facing/i.test(input.message)
          ? "Besides Vastu and direction preference, do you have any specific floor or balcony view requirements?"
          : `Are you looking for a ready-to-move ${input.property_requirement} or is under-construction acceptable?`,
        input.location && input.location.trim().toLowerCase() !== "bangalore"
          ? `Any particular tech parks, schools, or landmarks in ${input.location} you want to stay close to?`
          : "Which specific localities or tech corridors in Bangalore are your top priority?",
        timeline_urgency >= 9
          ? "Given your immediate moving timeline, is your financing or home loan pre-approval already in place?"
          : !input.budget || /flexible|discuss|tbd/i.test(input.budget)
          ? "What is your comfortable all-inclusive maximum budget ceiling?"
          : `For the ${input.budget} budget, are you planning self-financing or exploring home loan options?`,
      ],
    },
    site_visit: {
      recommended: true,
      preferred_day_offsets: timeline_urgency >= 9 ? [1, 2] : [2, 4],
      preferred_time_of_day: "morning",
      reason: timeline_urgency >= 9 ? "Immediate buyer ready for urgent property visit." : "High intent inquiry ready for shortlist review.",
    },
    spoken_brief: (() => {
      const propText = !input.property_requirement || /not specified|any|flexible/i.test(input.property_requirement)
        ? "residential property"
        : input.property_requirement;
      return `${input.name} wants ${propText} in ${input.location} around ${input.budget}. Call to verify timeline and arrange visit.`;
    })(),
    whatsapp_message: (() => {
      const isPropMissing =
        !input.property_requirement ||
        /not specified|any|flexible|unspecified/i.test(input.property_requirement.trim());
      const isBudgetMissing =
        !input.budget ||
        /not specified|flexible|discuss|tbd|unspecified/i.test(input.budget.trim());
      const isLocationMissing =
        !input.location ||
        /not specified|unspecified/i.test(input.location.trim()) ||
        input.location.trim().toLowerCase() === "bangalore";

      const missing: string[] = [];
      if (isPropMissing) missing.push("preferred BHK type (1, 2, or 3 BHK)");
      if (isBudgetMissing) missing.push("expected budget range");
      if (isLocationMissing) missing.push("preferred locality");

      const propPhrase = isPropMissing
        ? "a property"
        : `a ${input.property_requirement}`;
      const locPhrase = input.location && !/not specified/i.test(input.location)
        ? ` in ${input.location}`
        : "";

      let bodyAction = "";
      if (missing.length > 0) {
        const budgetMention = !isBudgetMissing ? ` within ${input.budget}` : "";
        bodyAction = ` Could you let me know your ${missing.join(" and ")} so I can filter the best options${budgetMention}?`;
      } else {
        bodyAction = ` I have curated shortlists within ${input.budget}. Shall we schedule a brief call today?`;
      }

      return `Hi ${input.name}, I received your inquiry for ${propPhrase}${locPhrase}.${bodyAction}`;
    })(),
  };

  return normalizeLeadSignalsAndReadiness(baseAnalysis, input.timeline, input.message, input.budget, input.property_requirement);
}

export async function runLeadAnalysis(input: {
  name: string;
  phone?: string | null;
  location: string;
  property_requirement: string;
  budget: string;
  timeline: string;
  message: string;
}): Promise<{ analysis: Analysis; provider: "gemini" | "groq" | "fallback" }> {
  const recordText = `
Name: ${input.name}
Phone: ${input.phone || "Not provided"}
Location: ${input.location}
Property requirement: ${input.property_requirement}
Budget: ${input.budget}
Timeline: ${input.timeline}
Customer Message: ${input.message}
`.trim();

  const prompt = `${systemPrompt}\n\n--- Lead Record ---\n${recordText}\n--- End Lead ---\n\nRespond ONLY with a JSON object adhering strictly to the schema.`;

  // 1. Try Groq (ultra fast ~250ms)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const envModel = process.env.GROQ_MODEL?.trim();
      const model = envModel && !envModel.toLowerCase().includes("openai")
        ? envModel
        : "llama-3.3-70b-versatile";
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You output strictly valid JSON conforming to the requested schema." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawJson = data?.choices?.[0]?.message?.content;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          const validated = analysisSchema.parse(parsed);
          normalizeLeadSignalsAndReadiness(validated, input.timeline, input.message, input.budget, input.property_requirement);
          return { analysis: validated, provider: "groq" };
        }
      }
    } catch (err) {
      console.warn("[analyzeLead] Groq analysis failed, trying Gemini fallback:", err);
    }
  }

  // 2. Try Gemini (reliable fallback)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson.replace(/^```json|```$/g, "").trim());
          const validated = analysisSchema.parse(parsed);
          normalizeLeadSignalsAndReadiness(validated, input.timeline, input.message, input.budget, input.property_requirement);
          return { analysis: validated, provider: "gemini" };
        }
      }
    } catch (err) {
      console.warn("[analyzeLead] Gemini analysis failed:", err);
    }
  }

  // 3. Deterministic Fallback
  console.log("[analyzeLead] Using deterministic analysis fallback");
  return { analysis: makeFallbackAnalysis(input), provider: "fallback" };
}

