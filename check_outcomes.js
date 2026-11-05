
const { createClient } = require('@libsql/client');
const fs = require('fs');

const env = fs.readFileSync('C:/Users/Akshaya G/masaldesk/.env.local', 'utf8');
const url = env.split('\n').find(l => l.startsWith('TURSO_DATABASE_URL=')).split('=')[1].trim().replace(/^['"]|['"]$/g, '');
const token = env.split('\n').find(l => l.startsWith('TURSO_AUTH_TOKEN=')).split('=')[1].trim().replace(/^['"]|['"]$/g, '');

const db = createClient({ url, authToken: token });

async function main() {
  console.log("Standardizing DB leads...");

  // 1. Update tags to match website: high, medium, low
  await db.execute("UPDATE leads SET tag = 'high' WHERE tag = 'hot'");
  await db.execute("UPDATE leads SET tag = 'medium' WHERE tag = 'warm'");
  await db.execute("UPDATE leads SET tag = 'low' WHERE tag = 'cold'");

  // 2. Update statuses to match website: New, Closed, Connected – Interested, Visit Scheduled
  await db.execute("UPDATE leads SET status = 'New' WHERE status = 'new'");
  await db.execute("UPDATE leads SET status = 'Closed' WHERE status = 'closed'");
  await db.execute("UPDATE leads SET status = 'Connected – Interested' WHERE status = 'contacted'");
  await db.execute("UPDATE leads SET status = 'Visit Scheduled' WHERE status = 'visit_scheduled'");

  // 3. Update realistic readiness for seed leads if currently 100
  // Sneha Patel (budget clear, loc clear, prop clear, timeline vague, dec vague -> 80)
  await db.execute("UPDATE leads SET readiness_pct = 80 WHERE name = 'Sneha Patel'");
  // Anand Rao (budget clear, loc clear, prop clear, timeline missing, dec vague -> 70)
  await db.execute("UPDATE leads SET readiness_pct = 70 WHERE name = 'Anand Rao'");
  // Arun Sharma (budget clear, loc clear, prop clear, timeline vague, dec vague -> 80)
  await db.execute("UPDATE leads SET readiness_pct = 80 WHERE name = 'Arun Sharma'");
  // Priya Singh (budget clear, loc clear, prop clear, timeline missing, dec missing -> 60)
  await db.execute("UPDATE leads SET readiness_pct = 60 WHERE name = 'Priya Singh'");
  // Neha Joshi (budget clear, loc clear, prop clear, timeline vague, dec clear -> 90)
  await db.execute("UPDATE leads SET readiness_pct = 90 WHERE name = 'Neha Joshi'");

  // 4. Fetch and display updated DB records
  const leads = await db.execute("SELECT id, name, tag, status, readiness_pct, score FROM leads");
  console.log("Updated Leads in DB:");
  console.table(leads.rows);
}

main().catch(console.error);
