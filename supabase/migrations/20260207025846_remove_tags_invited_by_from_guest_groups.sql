-- Remove tags and invited_by from guest_groups table.
-- These fields now live exclusively on the guests table.
-- Group-level tags/invited_by are derived by aggregating from child guests at query time.

ALTER TABLE "guest_groups" DROP COLUMN IF EXISTS "tags";
ALTER TABLE "guest_groups" DROP COLUMN IF EXISTS "invited_by";
