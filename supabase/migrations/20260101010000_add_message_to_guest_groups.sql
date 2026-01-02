-- Add message field to guest_groups table to store RSVP messages from the group
alter table "guest_groups" 
add column if not exists "message" text;

-- Add submitted_at timestamp to track when the group submitted their RSVP
alter table "guest_groups"
add column if not exists "rsvp_submitted_at" timestamp with time zone;
