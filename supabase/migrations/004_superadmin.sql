-- ============================================================
-- Migration 004 — Super Admin Users
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists superadmin_users (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'support',
  created_by    uuid references superadmin_users(id) on delete set null,
  last_login    timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_superadmin_email on superadmin_users(email);

create trigger superadmin_updated_at before update on superadmin_users
  for each row execute procedure update_updated_at();
