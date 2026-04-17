-- Migration 005 — Widget features: avatar, bubble color, display mode, visitor tracking
alter table tenants
  add column if not exists avatar_url      text    default '',
  add column if not exists bubble_color    text    default '#4F8EF7',
  add column if not exists widget_mode     text    default 'bubble';
  -- widget_mode: 'bubble' | 'always_open' | 'popup'

alter table leads
  add column if not exists country         text    default '',
  add column if not exists city            text    default '',
  add column if not exists device          text    default '',
  add column if not exists pages_visited   text[]  default '{}',
  add column if not exists session_count   int     default 1,
  add column if not exists ip_address      text    default '';
