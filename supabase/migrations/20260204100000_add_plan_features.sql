-- Migration: Add plan features system
-- This creates the centralized plan features tables and seeds initial data

-- Plan features table
create table if not exists "plan_features" (
  "id" uuid primary key default gen_random_uuid(),
  "plan" text not null check (plan in ('free', 'premium', 'deluxe')),
  "feature_key" text not null,
  "enabled" boolean default false,
  "limit_value" integer, -- For numeric limits (guests, groups, days, items)
  "config_json" jsonb default '{}'::jsonb, -- For complex configs (commission rates, frequencies)
  "description" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  unique("plan", "feature_key")
);

-- Enable RLS
alter table "plan_features" enable row level security;

-- Everyone can read plan features (needed for client-side checks)
create policy "Anyone can read plan features"
  on "plan_features"
  for select
  to public
  using (true);

-- Only superusers can modify plan features
create policy "Superusers can manage plan features"
  on "plan_features"
  for all
  to authenticated
  using (
    exists (
      select 1 from superusers where user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from superusers where user_id = auth.uid()
    )
  );

-- Plan pricing table
create table if not exists "plan_pricing" (
  "id" uuid primary key default gen_random_uuid(),
  "plan" text not null unique check (plan in ('free', 'premium', 'deluxe')),
  "price_usd" integer not null, -- In cents
  "price_mxn" integer not null, -- In centavos
  "stripe_price_id_usd" text,
  "stripe_price_id_mxn" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

alter table "plan_pricing" enable row level security;

create policy "Anyone can read plan pricing"
  on "plan_pricing" for select to public using (true);

create policy "Superusers can manage plan pricing"
  on "plan_pricing" for all to authenticated
  using (exists (select 1 from superusers where user_id = auth.uid()))
  with check (exists (select 1 from superusers where user_id = auth.uid()));

-- Indexes
create index if not exists idx_plan_features_plan on plan_features(plan);
create index if not exists idx_plan_features_feature_key on plan_features(feature_key);

-- Add plan column to wedding_features
alter table wedding_features add column if not exists "plan" text default 'free' check (plan in ('free', 'premium', 'deluxe'));

-- Create index for plan column
create index if not exists idx_wedding_features_plan on wedding_features(plan);

-- =============================================================================
-- SEED DATA: Plan Pricing
-- =============================================================================
insert into plan_pricing (plan, price_usd, price_mxn) values
  ('free', 0, 0),
  ('premium', 25000, 500000),   -- $250 USD / $5,000 MXN
  ('deluxe', 50000, 1000000)    -- $500 USD / $10,000 MXN
on conflict (plan) do update set
  price_usd = excluded.price_usd,
  price_mxn = excluded.price_mxn;

-- =============================================================================
-- SEED DATA: Free Plan Features
-- =============================================================================
insert into plan_features (plan, feature_key, enabled, limit_value, config_json, description) values
  -- Guest limits
  ('free', 'guests_limit', true, 50, '{}', 'Maximum number of guests allowed'),
  ('free', 'guest_groups_limit', true, 15, '{}', 'Maximum number of guest groups'),
  
  -- Activity tracking
  ('free', 'activity_tracking_limit', true, 8, '{"type": "items"}', 'Number of activity items shown'),
  
  -- Core features (disabled for free)
  ('free', 'rsvp_enabled', false, null, '{}', 'RSVP functionality'),
  ('free', 'custom_registry_enabled', false, null, '{}', 'Custom registry with Stripe payments'),
  ('free', 'registry_links_enabled', true, null, '{}', 'External registry links only'),
  ('free', 'subdomain_enabled', false, null, '{}', 'Custom subdomain support'),
  
  -- Tracking & Reports (disabled for free)
  ('free', 'confirmation_tracking_enabled', false, null, '{}', 'Email/link open tracking'),
  ('free', 'message_templates_enabled', false, null, '{}', 'Custom message templates'),
  ('free', 'activity_reports_enabled', false, null, '{}', 'Activity reports'),
  
  -- Premium features (disabled for free)
  ('free', 'whatsapp_automation_enabled', false, null, '{}', 'WhatsApp automation'),
  ('free', 'custom_components_enabled', false, null, '{}', 'Custom section components'),
  ('free', 'ticket_support_enabled', false, null, '{}', 'Ticket-based support'),
  ('free', 'dedicated_support_enabled', false, null, '{}', 'Dedicated support agent'),
  
  -- Registry commission (N/A for free)
  ('free', 'registry_commission', false, null, '{"commission_mxn": 0}', 'Platform commission on registry contributions')
on conflict (plan, feature_key) do update set
  enabled = excluded.enabled,
  limit_value = excluded.limit_value,
  config_json = excluded.config_json,
  description = excluded.description;

-- =============================================================================
-- SEED DATA: Premium Plan Features
-- =============================================================================
insert into plan_features (plan, feature_key, enabled, limit_value, config_json, description) values
  -- Guest limits
  ('premium', 'guests_limit', true, 250, '{}', 'Maximum number of guests allowed'),
  ('premium', 'guest_groups_limit', true, null, '{}', 'Unlimited guest groups'),
  
  -- Activity tracking
  ('premium', 'activity_tracking_limit', true, 7, '{"type": "days"}', 'Number of days of activity history'),
  
  -- Core features
  ('premium', 'rsvp_enabled', true, null, '{}', 'RSVP functionality'),
  ('premium', 'custom_registry_enabled', true, null, '{}', 'Custom registry with Stripe payments'),
  ('premium', 'registry_links_enabled', true, null, '{}', 'External registry links'),
  ('premium', 'subdomain_enabled', true, null, '{}', 'Custom subdomain support'),
  
  -- Tracking & Reports
  ('premium', 'confirmation_tracking_enabled', true, null, '{}', 'Email/link open tracking'),
  ('premium', 'message_templates_enabled', true, null, '{}', 'Custom message templates'),
  ('premium', 'activity_reports_enabled', true, null, '{"frequency": "weekly"}', 'Weekly activity reports'),
  
  -- Premium features
  ('premium', 'whatsapp_automation_enabled', false, null, '{}', 'WhatsApp automation'),
  ('premium', 'custom_components_enabled', false, null, '{}', 'Custom section components'),
  ('premium', 'ticket_support_enabled', true, null, '{}', 'Ticket-based support'),
  ('premium', 'dedicated_support_enabled', false, null, '{}', 'Dedicated support agent'),
  
  -- Registry commission
  ('premium', 'registry_commission', true, null, '{"commission_mxn": 2000}', 'Platform commission: 20 MXN per contribution')
on conflict (plan, feature_key) do update set
  enabled = excluded.enabled,
  limit_value = excluded.limit_value,
  config_json = excluded.config_json,
  description = excluded.description;

-- =============================================================================
-- SEED DATA: Deluxe Plan Features
-- =============================================================================
insert into plan_features (plan, feature_key, enabled, limit_value, config_json, description) values
  -- Guest limits (unlimited)
  ('deluxe', 'guests_limit', true, null, '{}', 'Unlimited guests'),
  ('deluxe', 'guest_groups_limit', true, null, '{}', 'Unlimited guest groups'),
  
  -- Activity tracking (unlimited)
  ('deluxe', 'activity_tracking_limit', true, null, '{"type": "unlimited"}', 'Unlimited activity history'),
  
  -- Core features
  ('deluxe', 'rsvp_enabled', true, null, '{}', 'RSVP functionality'),
  ('deluxe', 'custom_registry_enabled', true, null, '{}', 'Custom registry with Stripe payments'),
  ('deluxe', 'registry_links_enabled', true, null, '{}', 'External registry links'),
  ('deluxe', 'subdomain_enabled', true, null, '{}', 'Custom subdomain support'),
  
  -- Tracking & Reports
  ('deluxe', 'confirmation_tracking_enabled', true, null, '{}', 'Email/link open tracking'),
  ('deluxe', 'message_templates_enabled', true, null, '{}', 'Custom message templates'),
  ('deluxe', 'activity_reports_enabled', true, null, '{"frequency": "daily"}', 'Daily activity reports'),
  
  -- Premium features
  ('deluxe', 'whatsapp_automation_enabled', true, null, '{}', 'WhatsApp automation'),
  ('deluxe', 'custom_components_enabled', true, null, '{}', 'Custom section components'),
  ('deluxe', 'ticket_support_enabled', true, null, '{}', 'Ticket-based support'),
  ('deluxe', 'dedicated_support_enabled', true, null, '{}', 'Dedicated support agent'),
  
  -- Registry commission (reduced)
  ('deluxe', 'registry_commission', true, null, '{"commission_mxn": 1000}', 'Platform commission: 10 MXN per contribution')
on conflict (plan, feature_key) do update set
  enabled = excluded.enabled,
  limit_value = excluded.limit_value,
  config_json = excluded.config_json,
  description = excluded.description;
