-- ============================================================
-- KAALI — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── TENANTS ──────────────────────────────────────────────
-- One row per registered company/workspace
create table if not exists tenants (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,                        -- Owner name
  company         text not null,                        -- Company name
  email           text not null unique,                  -- Login email
  password_hash   text not null,                        -- bcrypt hash
  plan            text not null default 'starter',      -- starter | growth | business
  
  -- Bot config
  bot_name        text not null default 'Kaali',
  description     text default '',                      -- Company description for AI
  tone            text not null default 'friendly',     -- friendly | professional | sharp
  calendly_url    text default '',
  
  -- AI provider config (stored encrypted in production)
  ai_provider     text not null default 'claude',       -- claude | chatgpt
  api_key_enc     text default '',                      -- Encrypted API key
  ai_model        text not null default 'claude-sonnet-4-20250514',
  
  -- Usage tracking
  conversations_used    integer not null default 0,
  conversations_limit   integer not null default 100,   -- Based on plan
  usage_reset_at        timestamptz default (now() + interval '30 days'),
  
  -- Alert settings
  alert_email     text default '',
  alert_threshold integer not null default 80,          -- percentage
  alert_sent      boolean not null default false,
  
  -- Metadata
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── SERVICES ─────────────────────────────────────────────
-- Each tenant's service offerings (used in AI system prompt)
create table if not exists services (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── DOCUMENTS ────────────────────────────────────────────
-- PDFs uploaded by tenants; extracted text injected into AI prompt
create table if not exists documents (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  file_path       text not null,                        -- Supabase Storage path
  extracted_text  text default '',                      -- PDF text content
  file_size_kb    integer default 0,
  created_at      timestamptz not null default now()
);

-- ── CONVERSATIONS ─────────────────────────────────────────
-- One row per chat session
create table if not exists conversations (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  visitor_type    text default 'GENERAL',               -- CLIENT | EXISTING | INVESTOR | GENERAL
  lead_captured   boolean not null default false,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  page_url        text default '',                      -- URL visitor was on
  ip_hash         text default ''                       -- Hashed for privacy
);

-- ── MESSAGES ─────────────────────────────────────────────
-- Individual messages within a conversation
create table if not exists messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  role            text not null,                        -- user | assistant
  content         text not null,
  created_at      timestamptz not null default now()
);

-- ── LEADS ────────────────────────────────────────────────
-- Captured visitor contacts
create table if not exists leads (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  name            text not null,
  email           text not null,
  visitor_type    text not null default 'GENERAL',
  summary         text default '',                      -- AI-generated summary
  status          text not null default 'new',          -- new | contacted | converted
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── INDEXES ──────────────────────────────────────────────
create index if not exists idx_services_tenant        on services(tenant_id);
create index if not exists idx_documents_tenant       on documents(tenant_id);
create index if not exists idx_conversations_tenant   on conversations(tenant_id);
create index if not exists idx_conversations_started  on conversations(started_at desc);
create index if not exists idx_messages_conversation  on messages(conversation_id);
create index if not exists idx_messages_tenant        on messages(tenant_id);
create index if not exists idx_leads_tenant           on leads(tenant_id);
create index if not exists idx_leads_status           on leads(status);
create index if not exists idx_leads_created          on leads(created_at desc);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
-- Tenants can only access their own data.
-- We use service role key server-side, so these are an extra safety net.
alter table tenants       enable row level security;
alter table services      enable row level security;
alter table documents     enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;
alter table leads         enable row level security;

-- Service role bypasses RLS (used in our API routes)
-- These policies protect against direct DB access attempts

create policy "tenants: own row only"
  on tenants for all using (id = current_setting('app.tenant_id', true)::uuid);

create policy "services: own tenant only"
  on services for all using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "documents: own tenant only"
  on documents for all using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "conversations: own tenant only"
  on conversations for all using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "messages: own tenant only"
  on messages for all using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "leads: own tenant only"
  on leads for all using (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ── TRIGGERS ─────────────────────────────────────────────
-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tenants_updated_at before update on tenants
  for each row execute procedure update_updated_at();

create trigger leads_updated_at before update on leads
  for each row execute procedure update_updated_at();

-- ── PLAN LIMITS HELPER ───────────────────────────────────
-- Call this after changing plan to reset the limit
create or replace function set_plan_limit(tenant_id uuid, plan_name text)
returns void as $$
begin
  update tenants set
    plan = plan_name,
    conversations_limit = case plan_name
      when 'starter'  then 100
      when 'growth'   then 2000
      when 'business' then 999999
      else 100
    end
  where id = tenant_id;
end;
$$ language plpgsql;
