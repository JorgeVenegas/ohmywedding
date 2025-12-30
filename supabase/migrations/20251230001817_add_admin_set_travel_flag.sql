-- Add column to track if admin set the travel status
ALTER TABLE "public"."guests" ADD COLUMN IF NOT EXISTS "admin_set_travel" boolean DEFAULT false;

COMMENT ON COLUMN "public"."guests"."admin_set_travel" IS 'Indicates if the travel status was set by the admin before guest submission';

-- Set admin_set_travel to true for guests where is_traveling is true and they haven't submitted yet
UPDATE "public"."guests" 
SET "admin_set_travel" = true 
WHERE "is_traveling" = true 
AND "confirmation_status" = 'pending';
