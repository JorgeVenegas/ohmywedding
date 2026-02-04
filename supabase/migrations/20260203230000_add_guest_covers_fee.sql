-- Add guest_covers_fee column to registry_contributions table
-- This tracks whether the guest paid the platform fee or if it was deducted from the donation

alter table "registry_contributions" add column "guest_covers_fee" boolean default false;

-- Update the comment to reflect the new column
comment on table "registry_contributions" is 'Registry contributions tracking with optional guest-covered fees';
comment on column "registry_contributions"."guest_covers_fee" is 'Whether the guest paid the platform service fee separately (true) or it was deducted from donation (false)';
