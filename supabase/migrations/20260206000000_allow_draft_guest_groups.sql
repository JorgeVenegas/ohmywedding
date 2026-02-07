-- Allow guest groups to be created as drafts without a name
-- This enables creating a group first, then adding guests, then finalizing the group

-- Make name nullable to support draft groups
ALTER TABLE guest_groups ALTER COLUMN name DROP NOT NULL;

-- Add is_draft flag to identify incomplete groups
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;

-- Add an index for quickly finding draft groups
CREATE INDEX IF NOT EXISTS idx_guest_groups_draft ON guest_groups (wedding_id, is_draft) WHERE is_draft = true;

-- Update the schema file to reflect these changes
COMMENT ON COLUMN guest_groups.name IS 'Group name - can be NULL for draft groups that are being created';
COMMENT ON COLUMN guest_groups.is_draft IS 'Indicates if this is a draft group (created but not finalized)';
