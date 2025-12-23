-- Images table - Store all user-uploaded images
create table "images" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "wedding_name_id" text,
  "url" text not null,
  "storage_path" text not null,
  "filename" text not null,
  "size" integer,
  "mime_type" text,
  "caption" text,
  "alt_text" text,
  "uploaded_by" uuid references auth.users(id) on delete set null,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

-- Add index for faster queries by wedding
create index "idx_images_wedding" on "images"("wedding_id");

-- Add index for uploaded_by for user's image management
create index "idx_images_uploaded_by" on "images"("uploaded_by");

-- Enable RLS
alter table "images" enable row level security;

-- Images table policies
create policy "Anyone can view images" on images
  for select using (true);

create policy "Anyone can upload images" on images
  for insert with check (true);

create policy "Wedding owners can manage images" on images
  for all using (
    wedding_name_id in (
      select wedding_name_id from weddings where owner_id = auth.uid()
    )
  );
