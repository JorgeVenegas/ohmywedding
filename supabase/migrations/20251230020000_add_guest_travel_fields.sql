-- Add travel-related fields to guests table
-- This allows tracking if guests are traveling, from where, and their travel arrangements

-- Add is_traveling column (boolean, defaults to false)
ALTER TABLE "public"."guests" 
ADD COLUMN IF NOT EXISTS "is_traveling" boolean DEFAULT false;

-- Add traveling_from column (text, stores city/location name)
ALTER TABLE "public"."guests" 
ADD COLUMN IF NOT EXISTS "traveling_from" text;

-- Add travel_arrangement column (enum: needs_transport, own_means, null)
-- null means question not answered yet or not applicable
ALTER TABLE "public"."guests" 
ADD COLUMN IF NOT EXISTS "travel_arrangement" text;

-- Add constraint to ensure travel_arrangement only has valid values (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'guests_travel_arrangement_check' 
    AND conrelid = 'public.guests'::regclass
  ) THEN
    ALTER TABLE "public"."guests" 
    ADD CONSTRAINT "guests_travel_arrangement_check" 
    CHECK (travel_arrangement IS NULL OR travel_arrangement IN ('needs_transport', 'own_means'));
  END IF;
END$$;

-- Add ticket_attachment_url column (stores URL to uploaded ticket in Supabase storage)
ALTER TABLE "public"."guests" 
ADD COLUMN IF NOT EXISTS "ticket_attachment_url" text;

-- Comment on columns for documentation
COMMENT ON COLUMN "public"."guests"."is_traveling" IS 'Whether the guest is traveling from outside the area';
COMMENT ON COLUMN "public"."guests"."traveling_from" IS 'City or location the guest is traveling from';
COMMENT ON COLUMN "public"."guests"."travel_arrangement" IS 'How the guest will handle travel: needs_transport (needs ticket provided) or own_means (self-arranged)';
COMMENT ON COLUMN "public"."guests"."ticket_attachment_url" IS 'URL to uploaded travel ticket document in Supabase storage';
