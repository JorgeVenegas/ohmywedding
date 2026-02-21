-- Add show_front column to venue_elements
-- Controls whether the front direction indicator is shown for each element
ALTER TABLE "public"."venue_elements"
  ADD COLUMN IF NOT EXISTS "show_front" boolean NOT NULL DEFAULT true;
