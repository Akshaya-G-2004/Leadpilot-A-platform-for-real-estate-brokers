// src/app/api/leads/[id]/outcomes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDb, ensureSchema } from "@/lib/db";
import type { Lead } from "@/lib/types";

// Deterministic status mappings
export const OUTCOME_STATUS_MAP: Record<string, string> = {
  "Connected – Interested": "Connected – Interested",
  "Connected – Follow Up Later": "Connected – Follow Up Later",
  "Connected – Not Interested": "Connected – Not Interested",
  "Ringing / No Answer": "Ringing / No Answer",
  "Invalid Number": "Invalid Number",
  "Visit Scheduled": "Visit Scheduled",
  "Closed": "Closed",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing lead id" }, { status: 400 });

  try {
    await ensureSchema();
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT id, lead_id, outcome, notes, created_at
            FROM call_outcomes
            WHERE lead_id = ?
            ORDER BY created_at DESC`,
      args: [id],
    });

    return NextResponse.json({ outcomes: result.rows });
  } catch (err) {
    console.error("[outcomes GET]", err);
    return NextResponse.json({ outcomes: [] });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing lead id" }, { status: 400 });

  try {
    const { outcome, notes } = await req.json();
    if (!outcome) {
      return NextResponse.json({ error: "Missing outcome" }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();
    const outcomeId = uuidv4();
    const now = new Date().toISOString();

    // 1. Always insert into call_outcomes first
    await db.execute({
      sql: `INSERT INTO call_outcomes (id, lead_id, outcome, notes, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [outcomeId, id, outcome, notes || "", now],
    });

    // 2. Safely update lead status in DB
    const nextStatus = OUTCOME_STATUS_MAP[outcome] || outcome;
    try {
      await db.execute({
        sql: `UPDATE leads SET status = ? WHERE id = ?`,
        args: [nextStatus, id],
      });
    } catch {
      const fallback =
        outcome === "Visit Scheduled"
          ? "visit_scheduled"
          : outcome === "Closed"
          ? "closed"
          : "contacted";
      await db
        .execute({
          sql: `UPDATE leads SET status = ? WHERE id = ?`,
          args: [fallback, id],
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      outcome: {
        id: outcomeId,
        lead_id: id,
        outcome,
        notes: notes || "",
        created_at: now,
      },
      updatedStatus: nextStatus,
    });
  } catch (err) {
    console.error("[outcomes POST]", err);
    return NextResponse.json({ error: "Failed to record outcome" }, { status: 500 });
  }
}

