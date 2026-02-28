-- Dishes and food management
create table "dishes" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "name" text not null,
  "description" text,
  "category" text not null default 'main' check ("category" in ('appetizer', 'soup', 'salad', 'main', 'dessert', 'drink', 'other')),
  "is_vegetarian" boolean default false,
  "is_vegan" boolean default false,
  "is_gluten_free" boolean default false,
  "allergens" text,
  "display_order" integer not null default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

create index "idx_dishes_wedding" on dishes (wedding_id);

create table "guest_dish_assignments" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_id" uuid not null references guests(id) on delete cascade,
  "dish_id" uuid not null references dishes(id) on delete cascade,
  "created_at" timestamp with time zone default now()
);

create unique index "idx_guest_dish_unique" on guest_dish_assignments (wedding_id, guest_id);
create index "idx_guest_dish_dish" on guest_dish_assignments (dish_id);
create index "idx_guest_dish_guest" on guest_dish_assignments (guest_id);

create trigger "update_dishes_updated_at"
  before update on dishes
  for each row
  execute function update_updated_at_column();

-- Itinerary management with parent/child hierarchy
create table "itinerary_events" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "parent_id" uuid references itinerary_events(id) on delete cascade,
  "title" text not null,
  "description" text,
  "location" text,
  "start_time" timestamp with time zone not null,
  "end_time" timestamp with time zone,
  "notes" text,
  "icon" text,
  "display_order" integer not null default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

create index "idx_itinerary_events_wedding" on itinerary_events (wedding_id);
create index "idx_itinerary_events_parent" on itinerary_events (parent_id);

create trigger "update_itinerary_events_updated_at"
  before update on itinerary_events
  for each row
  execute function update_updated_at_column();

-- RLS policies for dishes
alter table dishes enable row level security;
alter table guest_dish_assignments enable row level security;
alter table itinerary_events enable row level security;

create policy "Users can view dishes for their weddings" on dishes
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Users can manage dishes for their weddings" on dishes
  for all using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Users can view dish assignments for their weddings" on guest_dish_assignments
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Users can manage dish assignments for their weddings" on guest_dish_assignments
  for all using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Users can view itinerary for their weddings" on itinerary_events
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Users can manage itinerary for their weddings" on itinerary_events
  for all using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );
