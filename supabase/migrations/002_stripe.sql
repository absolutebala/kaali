-- ============================================================
-- Migration 002 — Add Stripe billing columns
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

alter table tenants
  add column if not exists stripe_customer_id      text default null,
  add column if not exists stripe_subscription_id  text default null,
  add column if not exists usage_reset_at          timestamptz default (now() + interval '30 days');

create index if not exists idx_tenants_stripe_customer on tenants(stripe_customer_id);
