-- Photo gallery tables
create table "gallery_albums" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_name_id" text not null,
  "name" text not null,
  "description" text,
  "cover_photo_url" text,
  "is_public" boolean default true,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now(),
  foreign key ("wedding_name_id") references weddings("wedding_name_id") on delete cascade
);

-- Individual photos in the gallery
create table "gallery_photos" (
  "id" uuid primary key default gen_random_uuid(),
  "album_id" uuid references gallery_albums(id) on delete cascade,
  "wedding_name_id" text not null,
  "title" text,
  "description" text,
  "photo_url" text not null,
  "thumbnail_url" text,
  "uploaded_by" text,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now(),
  foreign key ("wedding_name_id") references weddings("wedding_name_id") on delete cascade
);