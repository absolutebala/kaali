alter table tenants
  add column if not exists hubspot_token      text default '',
  add column if not exists zapier_webhook_url text default '';
