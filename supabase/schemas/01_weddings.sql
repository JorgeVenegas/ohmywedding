-- Weddings table - Core wedding information
create table "weddings" (
  "id" uuid primary key default gen_random_uuid(),
  "date_id" text not null,
  "wedding_name_id" text not null unique,
  "partner1_first_name" text not null,
  "partner1_last_name" text,
  "partner2_first_name" text not null,
  "partner2_last_name" text,
  "wedding_date" date,
  "wedding_time" time,
  "reception_time" time,
  "primary_color" text default '#d4a574',
  "secondary_color" text default '#9ba082',
  "accent_color" text default '#e6b5a3',
  "ceremony_venue_name" text,
  "ceremony_venue_address" text,
  "reception_venue_name" text,
  "reception_venue_address" text,
  "page_config" jsonb default '{}'::jsonb,
  "owner_id" uuid references auth.users(id) on delete set null,
  "collaborator_emails" text[] default '{}', -- Array of email addresses with edit access
  "og_title" text,
  "og_description" text,
  "og_image_url" text,
  "is_demo" boolean default false, -- Flag for demo/template weddings
  "stripe_account_id" text, -- Stripe Connect Express account ID for receiving registry payments
  "stripe_onboarding_completed" boolean default false, -- Whether the couple has completed Stripe Connect onboarding
  "payouts_enabled" boolean default false, -- Whether the connected account can receive payouts
  "has_website" boolean not null default false, -- Whether the wedding has a website configured in wedding_websites
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

-- Wedding schedule table - Timeline events
create table "wedding_schedule" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "event_name" text not null,
  "event_time" time not null,
  "event_description" text,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now()
);