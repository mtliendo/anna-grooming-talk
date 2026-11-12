import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | undefined;
let schemaReady = false;

function connect(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local.",
      );
    }
    client = neon(url);
  }
  return client;
}

export const sql: NeonQueryFunction<false, false> = ((
  strings: TemplateStringsArray,
  ...values: unknown[]
) => connect()(strings, ...values)) as NeonQueryFunction<false, false>;

/** Idempotent schema so a fresh Neon branch is usable after first query. */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`create extension if not exists pgcrypto`;
  await sql`
    create table if not exists dogs (
      id uuid primary key default gen_random_uuid(),
      user_sub text not null,
      name text not null,
      breed text not null,
      notes text,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists idx_dogs_user on dogs (user_sub)`;
  await sql`
    create table if not exists appointments (
      id uuid primary key default gen_random_uuid(),
      user_sub text not null,
      dog_id uuid not null references dogs (id) on delete cascade,
      service_id text not null,
      visit_date date not null,
      visit_time text not null,
      notes text,
      status text not null default 'booked',
      calendar_event_id text,
      calendar_event_link text,
      cancel_ciba_auth_req_id text,
      cancel_ciba_status text,
      cancel_ciba_interval_sec integer,
      cancel_ciba_last_polled_at timestamptz,
      cancel_ciba_expires_at timestamptz,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists idx_appointments_user on appointments (user_sub)`;
  await sql`
    create table if not exists chat_messages (
      id uuid primary key default gen_random_uuid(),
      user_sub text not null,
      role text not null,
      content text not null,
      meta jsonb,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists idx_chat_user on chat_messages (user_sub, created_at)`;
  schemaReady = true;
}
