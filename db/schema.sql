-- Anna's Dog Grooming talk demo — Neon Postgres
-- Idempotent. Run via Neon MCP run_sql_transaction or on first app boot.

create extension if not exists pgcrypto;

create table if not exists dogs (
  id uuid primary key default gen_random_uuid(),
  user_sub text not null,
  name text not null,
  breed text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_dogs_user on dogs (user_sub);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_sub text not null,
  dog_id uuid not null references dogs (id) on delete cascade,
  service_id text not null,
  visit_date date not null,
  visit_time text not null,
  notes text,
  -- booked | cancel_pending | cancelled
  status text not null default 'booked',
  calendar_event_id text,
  calendar_event_link text,
  cancel_ciba_auth_req_id text,
  cancel_ciba_status text,
  cancel_ciba_interval_sec integer,
  cancel_ciba_last_polled_at timestamptz,
  cancel_ciba_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_user on appointments (user_sub);
create index if not exists idx_appointments_status on appointments (user_sub, status);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_sub text not null,
  role text not null,
  content text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_user on chat_messages (user_sub, created_at);
