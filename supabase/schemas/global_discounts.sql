-- Global Discounts Table
-- Admin-configured promotional discounts (e.g., "Launching Month")
-- with per-payment-method discount percentages.
-- Only one discount should be active at a time.

CREATE TABLE IF NOT EXISTS public.global_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Display
  name TEXT NOT NULL,                    -- Internal name, e.g. "March Launch Promo"
  label TEXT NOT NULL,                   -- Badge text, e.g. "Launch Special"

  is_active BOOLEAN NOT NULL DEFAULT false,

  -- Per plan per payment method discount percentages
  premium_card_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (premium_card_discount_percent >= 0 AND premium_card_discount_percent <= 100),
  premium_msi_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (premium_msi_discount_percent >= 0 AND premium_msi_discount_percent <= 100),
  deluxe_card_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (deluxe_card_discount_percent >= 0 AND deluxe_card_discount_percent <= 100),
  deluxe_msi_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (deluxe_msi_discount_percent >= 0 AND deluxe_msi_discount_percent <= 100),

  -- Linked Stripe coupon IDs (auto-created when promotion is saved)
  premium_card_stripe_coupon_id TEXT,
  premium_msi_stripe_coupon_id TEXT,
  deluxe_card_stripe_coupon_id TEXT,
  deluxe_msi_stripe_coupon_id TEXT,

  -- Which plans this applies to
  applies_to_plans TEXT[] NOT NULL DEFAULT '{premium,deluxe}',

  -- Validity window
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,                  -- NULL = no end date

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER set_global_discounts_updated_at
  BEFORE UPDATE ON public.global_discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.global_discounts ENABLE ROW LEVEL SECURITY;

-- Anyone can read active discounts (needed for pricing display)
CREATE POLICY "Anyone can read active global discounts"
  ON public.global_discounts
  FOR SELECT
  USING (true);

-- Superadmins can manage
CREATE POLICY "Superadmins can manage global discounts"
  ON public.global_discounts
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.superusers WHERE is_active = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.superusers WHERE is_active = true)
  );

-- Service role full access
CREATE POLICY "Service role can manage global discounts"
  ON public.global_discounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_global_discounts_is_active ON public.global_discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_global_discounts_active_window
  ON public.global_discounts(is_active, starts_at, ends_at);

-- Grants
GRANT SELECT ON public.global_discounts TO anon;
GRANT SELECT ON public.global_discounts TO authenticated;
GRANT ALL ON public.global_discounts TO service_role;
