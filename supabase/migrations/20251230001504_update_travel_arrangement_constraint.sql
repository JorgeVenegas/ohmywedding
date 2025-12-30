-- Update the travel_arrangement check constraint to include new values
ALTER TABLE "public"."guests" DROP CONSTRAINT IF EXISTS "guests_travel_arrangement_check";

ALTER TABLE "public"."guests" ADD CONSTRAINT "guests_travel_arrangement_check" 
  CHECK (travel_arrangement IN ('needs_transport', 'own_means', 'will_buy_ticket', 'no_ticket_needed'));

COMMENT ON CONSTRAINT "guests_travel_arrangement_check" ON "public"."guests" IS 
  'Valid travel arrangements: needs_transport (organizer provides), own_means (self-arranged), will_buy_ticket (requires ticket upload), no_ticket_needed (requires reason)';
