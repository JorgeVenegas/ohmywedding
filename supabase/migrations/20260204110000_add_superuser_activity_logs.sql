-- Migration: Add superuser activity logs
-- Tracks all actions performed by superusers for audit purposes

create table if not exists "superuser_activity_logs" (
  "id" uuid primary key default gen_random_uuid(),
  "superuser_id" uuid not null references auth.users(id) on delete cascade,
  "action_type" text not null, -- 'plan_change', 'feature_update', 'wedding_edit', etc.
  "target_type" text not null, -- 'wedding', 'plan_feature', 'user', etc.
  "target_id" text not null, -- The ID of the target (wedding_id, feature_id, etc.)
  "target_name" text, -- Human-readable name (wedding name, feature key, etc.)
  "old_value" jsonb, -- Previous state
  "new_value" jsonb, -- New state
  "reason" text, -- Required reason for the change
  "metadata" jsonb default '{}'::jsonb, -- Additional context
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp with time zone default now()
);

-- Enable RLS
alter table "superuser_activity_logs" enable row level security;

-- Only superusers can read activity logs
create policy "Superusers can read activity logs"
  on "superuser_activity_logs"
  for select
  to authenticated
  using (
    exists (
      select 1 from superusers where user_id = auth.uid()
    )
  );

-- Only superusers can insert activity logs
create policy "Superusers can insert activity logs"
  on "superuser_activity_logs"
  for insert
  to authenticated
  with check (
    exists (
      select 1 from superusers where user_id = auth.uid()
    )
  );

-- Indexes for efficient queries
create index if not exists idx_superuser_activity_logs_superuser_id on superuser_activity_logs(superuser_id);
create index if not exists idx_superuser_activity_logs_action_type on superuser_activity_logs(action_type);
create index if not exists idx_superuser_activity_logs_target_type on superuser_activity_logs(target_type);
create index if not exists idx_superuser_activity_logs_created_at on superuser_activity_logs(created_at desc);
