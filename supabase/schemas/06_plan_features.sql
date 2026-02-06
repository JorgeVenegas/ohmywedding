-- Plan Features table - Centralized source of truth for plan permissions
-- This table defines what features are available for each subscription plan

-- Plan features table
create table "plan_features" (
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
create table "plan_pricing" (
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
create index idx_plan_features_plan on plan_features(plan);
create index idx_plan_features_feature_key on plan_features(feature_key);
