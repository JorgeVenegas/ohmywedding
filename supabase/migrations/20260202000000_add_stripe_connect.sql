-- Add Stripe Connect fields to weddings table for direct payouts to couples
ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payouts_enabled boolean DEFAULT false;

-- Add index for faster lookups by stripe account
CREATE INDEX IF NOT EXISTS idx_weddings_stripe_account_id ON weddings(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN weddings.stripe_account_id IS 'Stripe Connect Express account ID for receiving registry payments';
COMMENT ON COLUMN weddings.stripe_onboarding_completed IS 'Whether the couple has completed Stripe Connect onboarding';
COMMENT ON COLUMN weddings.payouts_enabled IS 'Whether the connected account can receive payouts (set by Stripe webhook)';
