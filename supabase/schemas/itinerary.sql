-- Itinerary management for wedding events with parent/child hierarchy

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
