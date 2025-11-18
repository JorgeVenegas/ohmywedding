-- Gift registry and wishlist tables
create table "gift_registries" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_name_id" text not null,
  "registry_name" text not null,
  "store_name" text,
  "registry_url" text,
  "description" text,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now(),
  foreign key ("wedding_name_id") references weddings("wedding_name_id") on delete cascade
);

-- Individual gift items
create table "gift_items" (
  "id" uuid primary key default gen_random_uuid(),
  "registry_id" uuid references gift_registries(id) on delete cascade,
  "wedding_name_id" text not null,
  "item_name" text not null,
  "description" text,
  "price" decimal(10,2),
  "item_url" text,
  "image_url" text,
  "is_purchased" boolean default false,
  "purchased_by" text,
  "purchased_at" timestamp with time zone,
  "created_at" timestamp with time zone default now(),
  foreign key ("wedding_name_id") references weddings("wedding_name_id") on delete cascade
);