-- =============================================================================
-- OHMYWEDDING DATABASE SCHEMA
-- Complete schema for wedding website application
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. CORE TABLES
-- =============================================================================

-- Weddings table - Core wedding information
create table "weddings" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" text unique not null,
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
  "owner_id" uuid references auth.users(id) on delete cascade,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

-- Wedding schedule table - Timeline events
create table "wedding_schedule" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" text references weddings(wedding_id) on delete cascade,
  "event_name" text not null,
  "event_time" time not null,
  "event_description" text,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now()
);

-- =============================================================================
-- 2. RSVP TABLES
-- =============================================================================

-- RSVP responses table
create table "rsvps" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" text references weddings(wedding_id) on delete cascade,
  "guest_name" text not null,
  "guest_email" text not null,
  "attending" text not null,
  "companions" integer default 0,
  "dietary_restrictions" text,
  "message" text,
  "submitted_at" timestamp with time zone default now()
);

-- =============================================================================
-- 3. CONTENT TABLES
-- =============================================================================

-- FAQ table
create table "wedding_faqs" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" text references weddings(wedding_id) on delete cascade,
  "question" text not null,
  "answer" text not null,
  "display_order" integer default 0,
  "is_visible" boolean default true,
  "created_at" timestamp with time zone default now()
);

-- =============================================================================
-- 4. GALLERY TABLES
-- =============================================================================

-- Photo gallery albums
create table "gallery_albums" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" text references weddings(wedding_id) on delete cascade,
  "name" text not null,
  "description" text,
  "cover_photo_url" text,
  "is_public" boolean default true,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now()
);

-- Individual photos in the gallery
create table "gallery_photos" (
  "id" uuid primary key default gen_random_uuid(),
  "album_id" uuid references gallery_albums(id) on delete cascade,
  "wedding_id" text references weddings(wedding_id) on delete cascade,
  "title" text,
  "description" text,
  "photo_url" text not null,
  "thumbnail_url" text,
  "uploaded_by" text,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now()
);

-- =============================================================================
-- 5. INDEXES
-- =============================================================================

create index "idx_weddings_wedding_id" on weddings("wedding_id");
create index "idx_weddings_owner_id" on weddings("owner_id");
create index "idx_weddings_wedding_date" on weddings("wedding_date");
create index "idx_rsvps_wedding_id" on rsvps("wedding_id");
create index "idx_rsvps_email" on rsvps("guest_email");
create index "idx_gallery_albums_wedding_id" on gallery_albums("wedding_id");
create index "idx_gallery_photos_album_id" on gallery_photos("album_id");
create index "idx_wedding_faqs_wedding_id" on wedding_faqs("wedding_id");
create index "idx_wedding_schedule_wedding_id" on wedding_schedule("wedding_id");

-- =============================================================================
-- 6. ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
alter table "weddings" enable row level security;
alter table "wedding_schedule" enable row level security;
alter table "rsvps" enable row level security;
alter table "gallery_albums" enable row level security;
alter table "gallery_photos" enable row level security;
alter table "wedding_faqs" enable row level security;

-- Public read policies (guests can view wedding content)
create policy "Anyone can view weddings" on weddings for select using (true);
create policy "Anyone can view wedding schedule" on wedding_schedule for select using (true);
create policy "Anyone can view gallery albums" on gallery_albums for select using (is_public = true);
create policy "Anyone can view gallery photos" on gallery_photos for select using (true);
create policy "Anyone can view wedding FAQs" on wedding_faqs for select using (is_visible = true);
create policy "Anyone can view RSVPs" on rsvps for select using (true);

-- RSVP policies
create policy "Anyone can submit RSVPs" on rsvps for insert with check (true);

-- Wedding creation
create policy "Anyone can create weddings" on weddings for insert with check (true);

-- Owner management policies
create policy "Wedding owners can manage their weddings" on weddings
  for all using (auth.uid() = owner_id);

create policy "Wedding owners can manage schedule" on wedding_schedule
  for all using (
    wedding_id in (select wedding_id from weddings where owner_id = auth.uid())
  );

create policy "Wedding owners can manage FAQs" on wedding_faqs
  for all using (
    wedding_id in (select wedding_id from weddings where owner_id = auth.uid())
  );

create policy "Wedding owners can manage gallery" on gallery_albums
  for all using (
    wedding_id in (select wedding_id from weddings where owner_id = auth.uid())
  );

create policy "Wedding owners can manage photos" on gallery_photos
  for all using (
    wedding_id in (select wedding_id from weddings where owner_id = auth.uid())
  );