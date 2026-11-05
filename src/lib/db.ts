// src/lib/db.ts
// libSQL client connected to Turso or local SQLite.
import { createClient, type Client } from "@libsql/client";
import { seedLeads } from "./seed";

let _db: Client | null = null;

export function getDb(): Client {
  if (_db) return _db;

  const rawUrl = process.env.TURSO_DATABASE_URL;
  const url =
    rawUrl && rawUrl.trim().length > 0 ? rawUrl.trim().replace(/^['"]|['"]$/g, "") : "file:./data/chat.db";

  const rawToken = process.env.TURSO_AUTH_TOKEN;
  const authToken =
    rawToken && rawToken.trim().length > 0 ? rawToken.trim().replace(/^['"]|['"]$/g, "") : undefined;

  _db = createClient({ url, authToken });
  return _db;
}

// ── Bootstrap schema & auto-seed leads into Turso ─────────────────────────
export async function ensureSchema(): Promise<void> {
  const db = getDb();

  // 1. Leads Table (supports high/medium/low tags and direct website statuses)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id                    TEXT PRIMARY KEY,
      created_at            TEXT NOT NULL,
      name                  TEXT NOT NULL,
      phone                 TEXT,
      location              TEXT NOT NULL,
      property_requirement  TEXT NOT NULL,
      budget                TEXT NOT NULL,
      timeline              TEXT NOT NULL,
      message               TEXT NOT NULL,
      score                 INTEGER NOT NULL,
      tag                   TEXT NOT NULL,
      readiness_pct         INTEGER NOT NULL,
      status                TEXT NOT NULL,
      analysis_provider     TEXT NOT NULL,
      analysis_json         TEXT
    )
  `);

  // 2. Chat Messages Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          TEXT PRIMARY KEY,
      lead_id     TEXT NOT NULL,
      role        TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content     TEXT NOT NULL,
      created_at  TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_chat_lead_id
    ON chat_messages(lead_id, created_at)
  `);

  // 3. Call Outcomes Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS call_outcomes (
      id          TEXT PRIMARY KEY,
      lead_id     TEXT NOT NULL,
      outcome     TEXT NOT NULL,
      notes       TEXT,
      created_at  TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_outcomes_lead_id
    ON call_outcomes(lead_id, created_at)
  `);

  // 3. Seed / sync Leads into Turso (English-only)
  const countRes = await db.execute("SELECT COUNT(*) as count FROM leads");
  const count = Number(countRes.rows[0]?.count ?? 0);

  // If table is empty or has old multilingual seed data, re-seed with clean English records
  const checkHindi = await db.execute("SELECT COUNT(*) as cnt FROM leads WHERE message LIKE '%क्या%' OR message LIKE '%ನನಗೆ%'");
  const hasNonEnglish = Number(checkHindi.rows[0]?.cnt ?? 0) > 0;

  if (count === 0 || hasNonEnglish) {
    console.log("[db] Reseeding clean English-only leads into Turso DB...");
    await db.execute("DELETE FROM leads");
    const statements = seedLeads.map((l) => ({
      sql: `INSERT INTO leads (
        id, created_at, name, phone, location, property_requirement,
        budget, timeline, message, score, tag, readiness_pct, status,
        analysis_provider, analysis_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        l.id,
        l.created_at,
        l.name,
        l.phone,
        l.location,
        l.property_requirement,
        l.budget,
        l.timeline,
        l.message,
        l.score,
        l.tag,
        l.readiness_pct,
        l.status,
        l.analysis_provider,
        l.analysis_json ? JSON.stringify(l.analysis_json) : null,
      ],
    }));

    await db.batch(statements);
    console.log(`[db] Successfully seeded ${seedLeads.length} leads into Turso.`);
  }
}
