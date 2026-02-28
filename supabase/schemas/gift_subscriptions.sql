-- Gift Subscriptions Table
-- Allows users to purchase plans as gifts without requiring a wedding
-- The gift code is shared with the couple who can redeem it when creating their wedding
CREATE TABLE IF NOT EXISTS public.gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Secure 16-character alphanumeric code
  code TEXT NOT NULL UNIQUE,
  
  -- Plan gifted
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'deluxe')),
  
  -- Purchaser info
  purchaser_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchaser_email TEXT,
  
  -- Stripe payment info
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'mxn',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  
  -- Redemption info
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL UNIQUE,
  
  -- Brute force protection
  redeem_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- If linked to a wedding, must be redeemed
  CONSTRAINT gift_redeemed_consistency CHECK (
    (wedding_id IS NULL) OR (redeemed_at IS NOT NULL AND status = 'redeemed')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_code ON public.gift_subscriptions(code);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_status ON public.gift_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_purchaser ON public.gift_subscriptions(purchaser_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_wedding ON public.gift_subscriptions(wedding_id);

-- Enable RLS
ALTER TABLE public.gift_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Purchasers can view their own gift cards
CREATE POLICY "Purchasers can view their gift subscriptions"
  ON public.gift_subscriptions
  FOR SELECT
  USING (purchaser_user_id = auth.uid());

-- Authenticated users can view by code (for redemption validation)
CREATE POLICY "Authenticated users can check gift code"
  ON public.gift_subscriptions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only service role can insert (via API after Stripe webhook)
-- No INSERT policy for authenticated users - handled by service role

-- Only service role can update (via API for redemption)
-- No UPDATE policy for authenticated users - handled by service role

-- Trigger for updated_at
CREATE TRIGGER update_gift_subscriptions_updated_at
  BEFORE UPDATE ON public.gift_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.gift_subscriptions TO authenticated;
