-- Add Stripe coupon ID columns to global_discounts
-- These store the Stripe coupon IDs auto-created for each plan/method combo
-- so checkout can apply them as proper Stripe discounts instead of adjusting unit_amount

ALTER TABLE public.global_discounts
  ADD COLUMN IF NOT EXISTS premium_card_stripe_coupon_id TEXT,
  ADD COLUMN IF NOT EXISTS premium_msi_stripe_coupon_id TEXT,
  ADD COLUMN IF NOT EXISTS deluxe_card_stripe_coupon_id TEXT,
  ADD COLUMN IF NOT EXISTS deluxe_msi_stripe_coupon_id TEXT;
