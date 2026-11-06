// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDb, ensureSchema } from "@/lib/db";
import { seedLeads } from "@/lib/seed";
import { runLeadAnalysis, normalizeLeadSignalsAndReadiness } from "@/lib/ai/analyzeLead";
import { deriveScores } from "@/lib/scoring";
import type { Lead } from "@/lib/types";

export async function GET() {
  try {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute("SELECT * FROM leads ORDER BY created_at DESC");

    const leads: Lead[] = result.rows.map((row) => {
      const analysis = row.analysis_json ? JSON.parse(String(row.analysis_json)) : null;
      let score = Number(row.score);
      let tag = row.tag as Lead["tag"];
      let readiness_pct = Number(row.readiness_pct);

      if (analysis?.signals && analysis?.readiness) {
        normalizeLeadSignalsAndReadiness(
          analysis,
          String(row.timeline || ""),
          String(row.message || ""),
          String(row.budget || ""),
          String(row.property_requirement || "")
        );

        if (analysis?.whatsapp_message && /for a Not Specified/i.test(analysis.whatsapp_message)) {
          analysis.whatsapp_message = analysis.whatsapp_message.replace(
            /for a Not Specified/i,
            "for a property"
          );
          if (!/preferred BHK/i.test(analysis.whatsapp_message)) {
            analysis.whatsapp_message += " Could you also share your preferred BHK type (1, 2, or 3 BHK)?";
          }
        }
        const derived = deriveScores(analysis.signals, analysis.readiness);
        score = derived.score;
        tag = derived.tag;
        readiness_pct = derived.readiness_pct;

        if (
          score !== Number(row.score) ||
          tag !== row.tag ||
          JSON.stringify(analysis) !== String(row.analysis_json)
        ) {
          db.execute({
            sql: "UPDATE leads SET score = ?, tag = ?, readiness_pct = ?, analysis_json = ? WHERE id = ?",
            args: [score, tag, readiness_pct, JSON.stringify(analysis), row.id],
          }).catch((err) => console.warn("[leads GET] sync score update failed:", err));
        }
      }

      return {
        id: String(row.id),
        created_at: String(row.created_at),
        name: String(row.name),
        phone: row.phone ? String(row.phone) : null,
        location: String(row.location),
        property_requirement: String(row.property_requirement),
        budget: String(row.budget),
        timeline: String(row.timeline),
        message: String(row.message),
        notes: (analysis?.notes as string) || (row.notes ? String(row.notes) : null),
        score,
        tag,
        readiness_pct,
        status: row.status as Lead["status"],
        analysis_provider: row.analysis_provider as Lead["analysis_provider"],
        analysis_json: analysis,
      };
    });

    return NextResponse.json({ leads, source: "turso" });
  } catch (err) {
    console.warn("[leads GET] Turso fetch failed, falling back to seed leads:", err);
    return NextResponse.json({ leads: seedLeads, source: "seed_fallback" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, location, property_requirement, budget, timeline, message, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Missing required fields (Customer Name and Phone Number are required)" },
        { status: 400 }
      );
    }

    const safeLocation = location?.trim() || "Bangalore";
    const safeProperty = property_requirement?.trim() || "Not Specified";
    const safeBudget = budget?.trim() || "Flexible";
    const safeTimeline = timeline?.trim() || "Not Specified";
    const safeMessage = message?.trim() || `Inquiry from ${name.trim()} (${phone.trim()})`;

    // 1. Run AI analysis (Gemini -> Groq -> fallback)
    const { analysis, provider } = await runLeadAnalysis({
      name,
      phone: phone ? String(phone) : null,
      location: safeLocation,
      property_requirement: safeProperty,
      budget: safeBudget,
      timeline: safeTimeline,
      message: safeMessage,
    });

    if (notes) {
      (analysis as any).notes = notes.trim();
    }

    normalizeLeadSignalsAndReadiness(analysis, safeTimeline, safeMessage, safeBudget, safeProperty);

    // 2. Derive scores
    const { score, tag, readiness_pct } = deriveScores(analysis.signals, analysis.readiness);

    const newLead: Lead = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      name,
      phone: phone ? String(phone) : null,
      location: safeLocation,
      property_requirement: safeProperty,
      budget: safeBudget,
      timeline: safeTimeline,
      message: safeMessage,
      notes: notes ? notes.trim() : null,
      score,
      tag,
      readiness_pct,
      status: "New",
      analysis_provider: provider as Lead["analysis_provider"],
      analysis_json: analysis as any,
    };

    // 3. Save to Turso DB
    await ensureSchema();
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO leads (
        id, created_at, name, phone, location, property_requirement,
        budget, timeline, message, score, tag, readiness_pct, status,
        analysis_provider, analysis_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newLead.id,
        newLead.created_at,
        newLead.name,
        newLead.phone,
        newLead.location,
        newLead.property_requirement,
        newLead.budget,
        newLead.timeline,
        newLead.message,
        newLead.score,
        newLead.tag,
        newLead.readiness_pct,
        newLead.status,
        newLead.analysis_provider,
        JSON.stringify(newLead.analysis_json),
      ],
    });

    return NextResponse.json({ success: true, lead: newLead });
  } catch (err) {
    console.error("[leads POST] Error creating lead:", err);
    return NextResponse.json({ error: "Failed to create and analyze lead" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, phone, location, property_requirement, budget, timeline, notes, scheduled_visit } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();

    // 1. If status update
    if (status) {
      await db.execute({
        sql: "UPDATE leads SET status = ? WHERE id = ?",
        args: [status, id],
      });
    }

    // 2. If general lead info update
    const updates: string[] = [];
    const args: any[] = [];

    if (phone !== undefined) {
      updates.push("phone = ?");
      args.push(phone);
    }
    if (location !== undefined) {
      updates.push("location = ?");
      args.push(location);
    }
    if (property_requirement !== undefined) {
      updates.push("property_requirement = ?");
      args.push(property_requirement);
    }
    if (budget !== undefined) {
      updates.push("budget = ?");
      args.push(budget);
    }
    if (timeline !== undefined) {
      updates.push("timeline = ?");
      args.push(timeline);
    }

    if (updates.length > 0) {
      args.push(id);
      await db.execute({
        sql: `UPDATE leads SET ${updates.join(", ")} WHERE id = ?`,
        args,
      });
    }

    // 3. Auto-reanalyze when key profile fields are updated
    const hasProfileChanges =
      property_requirement !== undefined ||
      budget !== undefined ||
      location !== undefined ||
      timeline !== undefined ||
      notes !== undefined;

    let updatedLeadData: any = null;

    if (hasProfileChanges && body.reanalyze !== false) {
      const current = await db.execute({
        sql: "SELECT * FROM leads WHERE id = ?",
        args: [id],
      });
      if (current.rows.length > 0) {
        const row = current.rows[0];
        const newName = String(row.name);
        const newPhone = phone !== undefined ? phone : row.phone;
        const newLocation = location !== undefined ? location : row.location;
        const newProperty = property_requirement !== undefined ? property_requirement : row.property_requirement;
        const newBudget = budget !== undefined ? budget : row.budget;
        const newTimeline = timeline !== undefined ? timeline : row.timeline;
        const newNotes = notes !== undefined ? notes : (row.notes || "");
        const rawMessage = String(row.message || "");

        // Run fresh AI analysis on the updated profile
        const { analysis, provider } = await runLeadAnalysis({
          name: newName,
          phone: newPhone ? String(newPhone) : null,
          location: String(newLocation),
          property_requirement: String(newProperty),
          budget: String(newBudget),
          timeline: String(newTimeline),
          message: rawMessage,
        });

        if (newNotes) {
          (analysis as any).notes = String(newNotes).trim();
        }

        normalizeLeadSignalsAndReadiness(
          analysis,
          String(newTimeline),
          rawMessage,
          String(newBudget),
          String(newProperty)
        );

        const { score, tag, readiness_pct } = deriveScores(analysis.signals, analysis.readiness);

        await db.execute({
          sql: `UPDATE leads SET score = ?, tag = ?, readiness_pct = ?, analysis_provider = ?, analysis_json = ? WHERE id = ?`,
          args: [score, tag, readiness_pct, provider, JSON.stringify(analysis), id],
        });

        updatedLeadData = {
          id,
          phone: newPhone,
          location: newLocation,
          property_requirement: newProperty,
          budget: newBudget,
          timeline: newTimeline,
          notes: newNotes,
          score,
          tag,
          readiness_pct,
          analysis_provider: provider,
          analysis_json: analysis,
        };
      }
    } else if (body.analysis_json !== undefined) {
      await db.execute({
        sql: "UPDATE leads SET analysis_json = ? WHERE id = ?",
        args: [JSON.stringify(body.analysis_json), id],
      });
    } else if (notes !== undefined || scheduled_visit !== undefined) {
      const current = await db.execute({
        sql: "SELECT analysis_json FROM leads WHERE id = ?",
        args: [id],
      });
      let analysis = current.rows[0]?.analysis_json ? JSON.parse(String(current.rows[0].analysis_json)) : {};
      if (notes !== undefined) analysis.notes = notes;
      if (scheduled_visit !== undefined) analysis.scheduled_visit = scheduled_visit;
      await db.execute({
        sql: "UPDATE leads SET analysis_json = ? WHERE id = ?",
        args: [JSON.stringify(analysis), id],
      });
    }

    return NextResponse.json({ success: true, id, lead: updatedLeadData });
  } catch (err) {
    console.error("[leads PATCH] Failed to update lead:", err);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
