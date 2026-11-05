// src/lib/chatStore.ts
// Transactional read/write of chat messages in libSQL.
import { getDb, ensureSchema } from "./db";
import { chatMessageSchema, type ChatMessage } from "./ai/chatSchema";

let schemaReady = false;

async function init() {
  if (!schemaReady) {
    await ensureSchema();
    schemaReady = true;
  }
}

/** Load all messages for a lead, ordered oldest→newest. */
export async function loadMessages(leadId: string): Promise<ChatMessage[]> {
  await init();
  const result = await getDb().execute({
    sql: `SELECT id, lead_id, role, content, created_at
          FROM chat_messages
          WHERE lead_id = ?
          ORDER BY created_at ASC`,
    args: [leadId],
  });

  return result.rows.map((row) =>
    chatMessageSchema.parse({
      id: row.id,
      lead_id: row.lead_id,
      role: row.role,
      content: row.content,
      created_at: row.created_at,
    })
  );
}

/** Save a user + assistant message in one transaction. */
export async function saveMessagePair(
  userMsg: ChatMessage,
  assistantMsg: ChatMessage
): Promise<void> {
  await init();

  // libSQL batch = atomic transaction
  await getDb().batch([
    {
      sql: `INSERT INTO chat_messages (id, lead_id, role, content, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        userMsg.id,
        userMsg.lead_id,
        userMsg.role,
        userMsg.content,
        userMsg.created_at,
      ],
    },
    {
      sql: `INSERT INTO chat_messages (id, lead_id, role, content, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        assistantMsg.id,
        assistantMsg.lead_id,
        assistantMsg.role,
        assistantMsg.content,
        assistantMsg.created_at,
      ],
    },
  ]);
}
