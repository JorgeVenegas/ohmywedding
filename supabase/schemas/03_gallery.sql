-- Photo gallery tables
create table "gallery_albums" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
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
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "title" text,
  "description" text,
  "photo_url" text not null,
  "thumbnail_url" text,
  "uploaded_by" text,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now()
);