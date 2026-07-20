-- Platform-wide settings controlled via the superadmin UI.
-- Simple key/value store; value is TEXT so callers parse as needed.
create table if not exists platform_settings (
  key   text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Seed defaults
insert into platform_settings (key, value) values
  ('msi_enabled', 'false')
on conflict (key) do nothing;

-- RLS: only service-role (server-side) can read/write; no direct client access
alter table platform_settings enable row level security;
