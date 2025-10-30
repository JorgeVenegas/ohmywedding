-- Weddings table - Core wedding information
create table "weddings" (
  "id" uuid primary key default gen_random_uuid(),
  "date_id" text not null,
  "wedding_name_id" text not null,
  "partner1_first_name" text not null,
  "partner1_last_name" text not null,
  "partner2_first_name" text not null,
  "partner2_last_name" text not null,
  "wedding_date" date not null,
  "wedding_time" time not null,
  "story" text,
  "primary_color" text default '#d4a574',
  "secondary_color" text default '#9ba082',
  "accent_color" text default '#e6b5a3',
  "ceremony_venue_name" text,
  "ceremony_venue_address" text,
  "reception_venue_name" text,
  "reception_venue_address" text,
  "owner_id" uuid, -- No foreign key constraint to allow guest weddings
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  unique("date_id", "wedding_name_id")
);

-- Wedding schedule table - Timeline events
create table "wedding_schedule" (
  "id" uuid primary key default gen_random_uuid(),
  "date_id" text not null,
  "wedding_name_id" text not null,
  "event_name" text not null,
  "event_time" time not null,
  "event_description" text,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now(),
  foreign key ("date_id", "wedding_name_id") references weddings("date_id", "wedding_name_id") on delete cascade
);