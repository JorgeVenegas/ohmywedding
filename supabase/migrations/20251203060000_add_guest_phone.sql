-- Add phone_number to guests table and make email truly optional
-- Also ensure guests can exist without a group

-- Add phone_number column to guests
alter table "public"."guests" add column if not exists "phone_number" text;

-- Create index for ungrouped guests queries
create index if not exists "idx_guests_ungrouped" on public.guests (wedding_name_id) where guest_group_id is null;
