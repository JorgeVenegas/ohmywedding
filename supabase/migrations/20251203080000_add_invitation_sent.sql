-- Add invitation_sent fields to guests and guest_groups tables

-- Add to guest_groups
ALTER TABLE guest_groups
ADD COLUMN IF NOT EXISTS invitation_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invitation_sent_at timestamp with time zone;

-- Add to guests
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS invitation_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invitation_sent_at timestamp with time zone;
