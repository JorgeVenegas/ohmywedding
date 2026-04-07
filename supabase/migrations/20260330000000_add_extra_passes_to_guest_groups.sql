-- Add extra passes columns to guest_groups
-- extra_passes: number of unnamed guest slots assigned to this group
-- extra_passes_confirmed: how many extra passes confirmed via RSVP

ALTER TABLE "guest_groups"
  ADD COLUMN IF NOT EXISTS "extra_passes" integer NOT NULL DEFAULT 0
    CHECK ("extra_passes" >= 0);

ALTER TABLE "guest_groups"
  ADD COLUMN IF NOT EXISTS "extra_passes_confirmed" integer NOT NULL DEFAULT 0
    CHECK ("extra_passes_confirmed" >= 0);
