-- RSVP and guest management tables

-- Guest groups table - Groups of guests (families, couples, etc.)
create table "guest_groups" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "name" text not null,
  "phone_number" text,
  "tags" text[] default '{}',
  "notes" text,
  "invited_by" text[] default '{}',
  "invitation_sent" boolean default false,
  "invitation_sent_at" timestamp with time zone,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

-- Guests table - Individual guests belonging to a group
create table "guests" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_group_id" uuid references guest_groups(id) on delete set null,
  "name" text not null,
  "phone_number" text,
  "email" text,
  "tags" text[] default '{}',
  "confirmation_status" text default 'pending' check ("confirmation_status" in ('pending', 'confirmed', 'declined')),
  "dietary_restrictions" text,
  "notes" text,
  "invited_by" text[] default '{}',
  "invitation_sent" boolean default false,
  "invitation_sent_at" timestamp with time zone,
  "is_traveling" boolean default false,
  "traveling_from" text,
  "travel_arrangement" text check ("travel_arrangement" in ('already_booked', 'no_transport', 'needs_transport', 'own_means', 'will_buy_ticket', 'no_ticket_needed')),
  "ticket_attachment_url" text,
  "no_ticket_reason" text,
  "admin_set_travel" boolean default false,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

-- Index for ungrouped guests queries
create index "idx_guests_ungrouped" on guests (wedding_id) where guest_group_id is null;

-- RSVP responses table - Public RSVP submissions
create table "rsvps" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_name" text not null,
  "guest_email" text not null,
  "attending" text not null,
  "companions" integer default 0,
  "dietary_restrictions" text,
  "message" text,
  "submitted_at" timestamp with time zone default now()
);