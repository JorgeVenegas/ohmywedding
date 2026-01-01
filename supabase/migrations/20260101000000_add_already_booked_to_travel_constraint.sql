-- Add 'already_booked' to the travel_arrangement check constraint
ALTER TABLE "public"."guests" DROP CONSTRAINT IF EXISTS "guests_travel_arrangement_check";

ALTER TABLE "public"."guests" ADD CONSTRAINT "guests_travel_arrangement_check" 
  CHECK (travel_arrangement IN ('already_booked', 'no_transport', 'needs_transport', 'own_means', 'will_buy_ticket', 'no_ticket_needed'));

COMMENT ON CONSTRAINT "guests_travel_arrangement_check" ON "public"."guests" IS 
  'Valid travel arrangements: already_booked (has ticket), no_transport (no need), needs_transport (organizer provides), own_means (self-arranged), will_buy_ticket (deprecated), no_ticket_needed (deprecated)';
