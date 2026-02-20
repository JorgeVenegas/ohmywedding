-- Seating chart tables for table arrangement and guest assignments

-- Seating tables - tables at the wedding venue
create table "seating_tables" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "name" text not null default 'Table',
  "shape" text not null default 'round' check ("shape" in ('round', 'rectangular')),
  "capacity" integer not null default 8,
  "side_a_count" integer,
  "side_b_count" integer,
  "position_x" double precision not null default 0,
  "position_y" double precision not null default 0,
  "rotation" double precision not null default 0,
  "width" double precision not null default 120,
  "height" double precision not null default 120,
  "display_order" integer not null default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

create index "idx_seating_tables_wedding" on seating_tables (wedding_id);

-- Seating assignments - which guest sits at which table
create table "seating_assignments" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "table_id" uuid not null references seating_tables(id) on delete cascade,
  "guest_id" uuid not null references guests(id) on delete cascade,
  "seat_number" integer,
  "created_at" timestamp with time zone default now()
);

create unique index "idx_seating_assignments_unique_guest" on seating_assignments (wedding_id, guest_id);
create index "idx_seating_assignments_table" on seating_assignments (table_id);

-- Venue elements - non-table elements on the floor plan
create table "venue_elements" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "element_type" text not null check ("element_type" in ('dance_floor', 'stage', 'entrance', 'bar', 'dj_booth')),
  "label" text,
  "position_x" double precision not null default 0,
  "position_y" double precision not null default 0,
  "width" double precision not null default 150,
  "height" double precision not null default 150,
  "rotation" double precision not null default 0,
  "created_at" timestamp with time zone default now()
);

create index "idx_venue_elements_wedding" on venue_elements (wedding_id);

-- Trigger for updated_at on seating_tables
create trigger "update_seating_tables_updated_at"
  before update on seating_tables
  for each row
  execute function update_updated_at_column();

-- Enable RLS
alter table "seating_tables" enable row level security;
alter table "seating_assignments" enable row level security;
alter table "venue_elements" enable row level security;

-- RLS: Owner and collaborators can manage seating tables
create policy "Wedding owners and collaborators can manage seating tables" on seating_tables
  for all
  using (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  )
  with check (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  );

-- RLS: Owner and collaborators can manage seating assignments
create policy "Wedding owners and collaborators can manage seating assignments" on seating_assignments
  for all
  using (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  )
  with check (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  );

-- RLS: Owner and collaborators can manage venue elements
create policy "Wedding owners and collaborators can manage venue elements" on venue_elements
  for all
  using (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  )
  with check (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  );

-- Add seating_enabled feature for deluxe plan
insert into plan_features (plan, feature_key, enabled, limit_value, description)
values
  ('free', 'seating_enabled', false, null, 'Seating chart floor plan designer'),
  ('premium', 'seating_enabled', false, null, 'Seating chart floor plan designer'),
  ('deluxe', 'seating_enabled', true, null, 'Seating chart floor plan designer')
on conflict (plan, feature_key) do update set
  enabled = excluded.enabled,
  description = excluded.description;
