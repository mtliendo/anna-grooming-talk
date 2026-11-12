import { ensureSchema, sql } from "@/lib/db";
import type { ChatMessage, ChatMeta } from "@/lib/types";

type Row = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta: ChatMeta | null;
  created_at: string;
};

export async function listMessages(userSub: string): Promise<ChatMessage[]> {
  await ensureSchema();
  const rows = await sql`
    select id, role, content, meta, created_at::text
    from chat_messages
    where user_sub = ${userSub}
    order by created_at asc
  `;
  return (rows as Row[]).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    meta: row.meta,
    createdAt: row.created_at,
  }));
}

export async function addMessage(
  userSub: string,
  role: "user" | "assistant",
  content: string,
  meta?: ChatMeta | null,
): Promise<void> {
  await ensureSchema();
  await sql`
    insert into chat_messages (user_sub, role, content, meta)
    values (${userSub}, ${role}, ${content}, ${meta ?? null})
  `;
}

export async function clearMessages(userSub: string): Promise<void> {
  await ensureSchema();
  await sql`delete from chat_messages where user_sub = ${userSub}`;
}
