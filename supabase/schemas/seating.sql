-- Seating chart tables for table arrangement and guest assignments

-- Seating tables - tables at the wedding venue
create table "seating_tables" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "name" text not null default 'Table',
  "shape" text not null default 'round' check ("shape" in ('round', 'rectangular', 'sweetheart')),
  "capacity" integer not null default 8,
  "side_a_count" integer, -- For rectangular: guests on side A (top)
  "side_b_count" integer, -- For rectangular: guests on side B (bottom)
  "head_a_count" integer, -- For rectangular: guests at head A (left end)
  "head_b_count" integer, -- For rectangular: guests at head B (right end)
  "position_x" double precision not null default 0,
  "position_y" double precision not null default 0,
  "rotation" double precision not null default 0, -- Degrees, for rectangular tables
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
  "seat_number" integer, -- Optional specific seat number
  "created_at" timestamp with time zone default now()
);

-- Each guest can only be assigned to one table per wedding
create unique index "idx_seating_assignments_unique_guest" on seating_assignments (wedding_id, guest_id);
create index "idx_seating_assignments_table" on seating_assignments (table_id);

-- Venue elements - non-table elements on the floor plan (dance floor, stage, etc.)
create table "venue_elements" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "element_type" text not null check ("element_type" in ('dance_floor', 'stage', 'entrance', 'bar', 'dj_booth', 'periquera', 'lounge', 'custom', 'area')),
  "element_shape" text not null default 'rect' check ("element_shape" in ('rect', 'circle', 'sofa_single', 'sofa_l', 'sofa_u', 'sofa_circle')),
  "label" text,
  "capacity" integer not null default 4,
  "position_x" double precision not null default 0,
  "position_y" double precision not null default 0,
  "width" double precision not null default 150,
  "height" double precision not null default 150,
  "rotation" double precision not null default 0,
  "color" text,
  "locked" boolean not null default false,
  "created_at" timestamp with time zone default now()
);

create index "idx_venue_elements_wedding" on venue_elements (wedding_id);

-- Triggers for updated_at
create trigger "update_seating_tables_updated_at"
  before update on seating_tables
  for each row
  execute function update_updated_at_column();
