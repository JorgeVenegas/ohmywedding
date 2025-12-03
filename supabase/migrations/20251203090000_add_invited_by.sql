-- Add invited_by field to guests and guest_groups tables
-- This tracks which partner(s) invited the guest (partner1, partner2, or both)

ALTER TABLE guests ADD COLUMN IF NOT EXISTS invited_by text[] DEFAULT '{}';
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS invited_by text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN guests.invited_by IS 'Array of partner names who invited this guest';
COMMENT ON COLUMN guest_groups.invited_by IS 'Array of partner names who invited this group';
