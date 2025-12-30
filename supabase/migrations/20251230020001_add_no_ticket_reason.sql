-- Add no_ticket_reason column to guests table
-- This stores the reason why a guest doesn't need to upload a ticket

ALTER TABLE "public"."guests" 
ADD COLUMN IF NOT EXISTS "no_ticket_reason" text;

COMMENT ON COLUMN "public"."guests"."no_ticket_reason" IS 'Reason provided by guest for not needing to upload a travel ticket';
