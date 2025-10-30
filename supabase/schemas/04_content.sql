-- FAQ and information tables
create table "wedding_faqs" (
  "id" uuid primary key default gen_random_uuid(),
  "date_id" text not null,
  "wedding_name_id" text not null,
  "question" text not null,
  "answer" text not null,
  "display_order" integer default 0,
  "is_visible" boolean default true,
  "created_at" timestamp with time zone default now(),
  foreign key ("date_id", "wedding_name_id") references weddings("date_id", "wedding_name_id") on delete cascade
);

-- Wedding information pages/sections
create table "wedding_pages" (
  "id" uuid primary key default gen_random_uuid(),
  "date_id" text not null,
  "wedding_name_id" text not null,
  "page_type" text not null,
  "title" text not null,
  "content" text,
  "is_enabled" boolean default true,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  foreign key ("date_id", "wedding_name_id") references weddings("date_id", "wedding_name_id") on delete cascade
);