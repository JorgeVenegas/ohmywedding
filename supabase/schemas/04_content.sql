-- FAQ and information tables
create table "wedding_faqs" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "question" text not null,
  "answer" text not null,
  "images" text[], -- Array of image URLs
  "display_order" integer default 0,
  "is_visible" boolean default true,
  "created_at" timestamp with time zone default now()
);

-- Wedding information pages/sections
create table "wedding_pages" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "page_type" text not null,
  "title" text not null,
  "content" text,
  "is_enabled" boolean default true,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);