-- Invitation tracking and activity logs

-- Invitation opens table - Track when invitations are viewed
create table "invitation_opens" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_group_id" uuid not null references guest_groups(id) on delete cascade,
  "opened_at" timestamp with time zone default now(),
  "ip_address" text,
  "user_agent" text,
  "country" text,
  "city" text,
  "device_type" text,
  "is_owner_view" boolean default false,
  "created_at" timestamp with time zone default now()
);

-- Index for efficient queries
create index "idx_invitation_opens_wedding" on invitation_opens (wedding_id);
create index "idx_invitation_opens_group" on invitation_opens (guest_group_id);
create index "idx_invitation_opens_wedding_group" on invitation_opens (wedding_id, guest_group_id);

-- Activity logs table - Track all wedding-related activity
create table "activity_logs" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_group_id" uuid references guest_groups(id) on delete set null,
  "guest_id" uuid references guests(id) on delete set null,
  "activity_type" text not null check ("activity_type" in (
    'invitation_opened',
    'rsvp_confirmed',
    'rsvp_declined',
    'rsvp_updated',
    'travel_info_updated',
    'guest_added',
    'guest_removed',
    'group_added',
    'group_removed',
    'message_sent',
    'registry_contribution'
  )),
  "description" text not null,
  "metadata" jsonb default '{}',
  "created_at" timestamp with time zone default now()
);

-- Index for efficient queries
create index "idx_activity_logs_wedding" on activity_logs (wedding_id);
create index "idx_activity_logs_wedding_created" on activity_logs (wedding_id, created_at desc);
create index "idx_activity_logs_type" on activity_logs (activity_type);

-- Add first_opened_at and open_count to guest_groups for quick access
alter table "guest_groups" add column if not exists "first_opened_at" timestamp with time zone;
alter table "guest_groups" add column if not exists "open_count" integer default 0;

-- Enable RLS on new tables
alter table "invitation_opens" enable row level security;
alter table "activity_logs" enable row level security;

-- RLS policies for invitation_opens
create policy "Anyone can track invitation opens" on invitation_opens
  for insert with check (true);

create policy "Wedding owners can view invitation opens" on invitation_opens
  for select using (
    exists (
      select 1 from weddings w 
      where w.id = invitation_opens.wedding_id 
      and (
        w.owner_id = auth.uid()
        or auth.jwt() ->> 'email' = any(w.collaborator_emails)
      )
    )
  );

-- RLS policies for activity_logs
create policy "Anyone can insert activity logs" on activity_logs
  for insert with check (true);

create policy "Wedding owners can view activity logs" on activity_logs
  for select using (
    exists (
      select 1 from weddings w 
      where w.id = activity_logs.wedding_id 
      and (
        w.owner_id = auth.uid()
        or auth.jwt() ->> 'email' = any(w.collaborator_emails)
      )
    )
  );

-- Function to update guest_group open stats when invitation is opened
create or replace function update_group_open_stats()
returns trigger as $$
begin
  update guest_groups
  set 
    first_opened_at = coalesce(first_opened_at, NEW.opened_at),
    open_count = open_count + 1,
    updated_at = now()
  where id = NEW.guest_group_id;
  
  return NEW;
end;
$$ language plpgsql;

-- Trigger to update open stats
create trigger trg_update_group_open_stats
  after insert on invitation_opens
  for each row
  when (NEW.is_owner_view = false)
  execute function update_group_open_stats();

-- Function to log activity
create or replace function log_activity(
  p_wedding_id uuid,
  p_activity_type text,
  p_description text,
  p_guest_group_id uuid default null,
  p_guest_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid as $$
declare
  v_id uuid;
begin
  insert into activity_logs (wedding_id, guest_group_id, guest_id, activity_type, description, metadata)
  values (p_wedding_id, p_guest_group_id, p_guest_id, p_activity_type, p_description, p_metadata)
  returning id into v_id;
  
  return v_id;
end;
$$ language plpgsql security definer;
