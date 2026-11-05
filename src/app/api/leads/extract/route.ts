// src/app/api/leads/extract/route.ts
// Ultra-fast entity extraction from inquiry text (<300ms using Groq/Regex)
import { NextRequest, NextResponse } from "next/server";

// Common Bengaluru locations for instant recognition
const KNOWN_LOCATIONS = [
  "Whitefield", "Indiranagar", "Koramangala", "HSR Layout", "Electronic City",
  "Sarjapur Road", "Hebbal", "Bellandur", "Marathahalli", "JP Nagar",
  "Jayanagar", "Yelahanka", "BTM Layout", "Banashankari", "MG Road"
];

function extractWithFastHeuristics(message: string) {
  // 1. Phone: 10 digit Indian numbers
  const phoneMatch = message.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, "") : "";

  // 2. Property Requirement: 1/2/3/4 BHK, Villa, Studio, Plot (empty if not mentioned)
  const propMatch = message.match(/(\d\s*bhk|villa|studio|plot|apartment|penthouse)/i);
  let property_requirement = "";
  if (propMatch) {
    const p = propMatch[0].toLowerCase();
    if (p.includes("1")) property_requirement = "1 BHK";
    else if (p.includes("2")) property_requirement = "2 BHK";
    else if (p.includes("3")) property_requirement = "3 BHK";
    else if (p.includes("4")) property_requirement = "4+ BHK Villa";
    else if (p.includes("studio")) property_requirement = "Studio Apartment";
    else if (p.includes("villa")) property_requirement = "4+ BHK Villa";
    else if (p.includes("plot")) property_requirement = "Plot / Land";
    else if (p.includes("penthouse")) property_requirement = "4+ BHK Villa";
    else if (p.includes("apartment")) property_requirement = "2 BHK";
  }

  // 3. Budget: e.g. "85 Lakh", "1.2 Cr", "45 Lacs", "1.5 Crore", "95L", "95 L"
  const budgetMatch = message.match(/(\d+(?:\.\d+)?\s*(?:lakhs?|lacs?|crores?|cr|l\b))/i);
  let budget = "";
  if (budgetMatch) {
    budget = budgetMatch[0].trim();
    if (/^\d+(\.\d+)?\s*l$/i.test(budget)) {
      budget = budget.replace(/l$/i, " Lakh").trim();
    }
  }

  // 4. Location: search known locations or "in <location>"
  let location = "";
  for (const loc of KNOWN_LOCATIONS) {
    if (new RegExp(`\\b${loc}\\b`, "i").test(message)) {
      location = `${loc}, Bangalore`;
      break;
    }
  }
  if (!location) {
    const locPattern = message.match(/\b(?:in|near|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (locPattern && !/bhk|crore|lakh|month|urgent/i.test(locPattern[1])) {
      location = locPattern[1];
    }
  }

  // 5. Name: e.g. "name is Arvind", "I'm Ananya Gupta", "Rahul Verma here", "this is Sneha", "i am Rahul Verma here"
  let name = "";
  // Check "Hi, Rahul Verma here" or "Hi, i am Rahul Verma here" or "Rahul Verma here"
  const hereMatch = message.match(/(?:hi|hello|hey)?[,\s!]+(?:i\s*am|i'?m|this\s*is|myself)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here/i);
  if (hereMatch) {
    name = hereMatch[1].trim();
  } else {
    const nameMatch = message.match(/(?:name is|i'?m|i am|this is|myself)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }
  }

  // 6. Timeline: e.g. "immediate", "in 2 months", "3 months", "2 weeks", "10 months", "next year", "no rush" (empty if not mentioned)
  let timeline = "";
  if (/no rush|next year|exploring|[6-9]\s*month|\d{2,}\s*month/i.test(message)) timeline = "6+ months / Exploring";
  else if (/immediate|urgent|asap|this week|1-2\s*week|2\s*week|two\s*week/i.test(message)) timeline = "Immediate (1-2 weeks)";
  else if (/1\s*month|within a month/i.test(message)) timeline = "Within 1 month";
  else if (/2\s*month/i.test(message)) timeline = "Within 2 months";
  else if (/3\s*month/i.test(message)) timeline = "Within 3 months";

  // 7. Special requirements / notes: e.g. "Must be Vastu compliant...", "east-facing", etc.
  let notes = "";
  const notesMatch = message.match(/(?:must be|prefer|looking for|require|facing|compliant|special requirements?)[^.!?\n]+(?:[.!?\n]|$)/i);
  if (notesMatch) {
    const candidate = notesMatch[0].trim().replace(/^[,\s]+|[.\s]+$/g, "");
    if (!/^(looking for|need)\s+(a\s+)?\d\s*bhk/i.test(candidate)) {
      notes = candidate;
    }
  }
  if (!notes) {
    const vastuMatch = message.match(/[^.!?\n]*(?:vastu|east-facing|west-facing|north-facing|south-facing|amenities|gated|pet friendly|balcony)[^.!?\n]*/i);
    if (vastuMatch) {
      notes = vastuMatch[0].trim().replace(/^[,\s]+|[.\s]+$/g, "");
    }
  }

  return { name, phone, location, property_requirement, budget, timeline, notes };
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message text" }, { status: 400 });
    }

    // 1. First run instant heuristics (<5ms)
    const fastFields = extractWithFastHeuristics(message);

    // If fast heuristic captured the core fields (location & budget), return immediately for instantaneous UX!
    if (fastFields.name && fastFields.budget && fastFields.location) {
      return NextResponse.json({ fields: fastFields, source: "fast_heuristics" });
    }

    // 2. Otherwise query Groq (lightning fast ~250ms Llama 3)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s strict timeout

        const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
        const prompt = `Extract JSON entities from this real estate message.
Message: "${message}"

Return JSON ONLY:
{
  "name": string,
  "phone": string,
  "location": string,
  "property_requirement": string,
  "budget": string,
  "timeline": string,
  "notes": string
}`;

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 250,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.choices?.[0]?.message?.content;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            // Merge with any fast fields
            return NextResponse.json({
              fields: {
                name: parsed.name || fastFields.name,
                phone: parsed.phone || fastFields.phone,
                location: parsed.location || fastFields.location,
                property_requirement: parsed.property_requirement || fastFields.property_requirement,
                budget: parsed.budget || fastFields.budget,
                timeline: parsed.timeline || fastFields.timeline,
                notes: parsed.notes || fastFields.notes || "",
              },
              source: "groq_fast",
            });
          }
        }
      } catch (err) {
        console.warn("[extract] Groq timeout/error, falling back to heuristics:", err);
      }
    }

    // 3. Fallback: Instant heuristic results
    return NextResponse.json({ fields: fastFields, source: "heuristics" });
  } catch (err) {
    console.error("[extract] Extraction error:", err);
    return NextResponse.json({
      fields: {
        name: "",
        phone: "",
        location: "",
        property_requirement: "2 BHK",
        budget: "",
        timeline: "Within 3 months",
      },
    });
  }
}
