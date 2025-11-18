-- RSVP and guest management tables
create table "guests" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_name_id" text not null,
  "name" text not null,
  "email" text not null,
  "attending" text default 'pending',
  "companions" integer default 0,
  "dietary_restrictions" text,
  "message" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  foreign key ("wedding_name_id") references weddings("wedding_name_id") on delete cascade
);

-- RSVP responses table
create table "rsvps" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_name_id" text not null,
  "guest_name" text not null,
  "guest_email" text not null,
  "attending" text not null,
  "companions" integer default 0,
  "dietary_restrictions" text,
  "message" text,
  "submitted_at" timestamp with time zone default now(),
  foreign key ("wedding_name_id") references weddings("wedding_name_id") on delete cascade
);