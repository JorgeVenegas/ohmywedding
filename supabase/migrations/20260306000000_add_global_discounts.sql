-- Migration: Add global_discounts table and payment_method to subscription_orders

-- 1. Create global_discounts table
CREATE TABLE IF NOT EXISTS public.global_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  card_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (card_discount_percent >= 0 AND card_discount_percent <= 100),
  msi_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (msi_discount_percent >= 0 AND msi_discount_percent <= 100),
  transfer_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (transfer_discount_percent >= 0 AND transfer_discount_percent <= 100),
  applies_to_plans TEXT[] NOT NULL DEFAULT '{premium,deluxe}',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_global_discounts_updated_at
  BEFORE UPDATE ON public.global_discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.global_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active global discounts"
  ON public.global_discounts FOR SELECT USING (true);

CREATE POLICY "Superadmins can manage global discounts"
  ON public.global_discounts FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.superusers WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.superusers WHERE is_active = true));

CREATE POLICY "Service role can manage global discounts"
  ON public.global_discounts FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_global_discounts_is_active ON public.global_discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_global_discounts_active_window
  ON public.global_discounts(is_active, starts_at, ends_at);

GRANT SELECT ON public.global_discounts TO anon;
GRANT SELECT ON public.global_discounts TO authenticated;
GRANT ALL ON public.global_discounts TO service_role;

-- 2. Add payment_method column to subscription_orders
ALTER TABLE public.subscription_orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IS NULL OR payment_method IN ('card', 'msi', 'transfer'));

-- 3. Add discount tracking columns to subscription_orders
ALTER TABLE public.subscription_orders
  ADD COLUMN IF NOT EXISTS global_discount_id UUID REFERENCES public.global_discounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS global_discount_percent INTEGER,
  ADD COLUMN IF NOT EXISTS original_amount_cents INTEGER;
