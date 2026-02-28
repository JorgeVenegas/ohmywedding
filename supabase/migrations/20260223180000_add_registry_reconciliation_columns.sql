-- Add columns for SPEI partial payment reconciliation
-- stripe_customer_id: track Stripe customer on connected account for balance sweeping
-- original_requested_amount: remember the originally requested amount before reconciliation adjustments
-- parent_contribution_id: link reconciled contributions to the original one

ALTER TABLE "public"."registry_contributions"
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" text,
  ADD COLUMN IF NOT EXISTS "original_requested_amount" decimal(10,2),
  ADD COLUMN IF NOT EXISTS "parent_contribution_id" uuid REFERENCES "public"."registry_contributions"("id") ON DELETE SET NULL;
