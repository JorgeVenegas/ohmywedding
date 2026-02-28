-- Migration: Onboarding Overhaul - Wedding as Platform, Website as Feature
-- 1. Create wedding_websites table (separates website config from weddings)
-- 2. Add has_website column to weddings table
-- 3. Migrate existing page_config data to wedding_websites
-- 4. Create gift_subscriptions table

-- ============================================================
-- 1. Create wedding_websites table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wedding_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  page_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_legacy BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wedding_websites_wedding_id_unique UNIQUE (wedding_id)
);

CREATE INDEX IF NOT EXISTS idx_wedding_websites_wedding_id ON public.wedding_websites(wedding_id);

ALTER TABLE public.wedding_websites ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for public wedding pages)
CREATE POLICY "Anyone can view wedding websites"
  ON public.wedding_websites
  FOR SELECT
  TO public
  USING (true);

-- Wedding owners can insert
CREATE POLICY "Wedding owners can insert their website"
  ON public.wedding_websites
  FOR INSERT
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = auth.uid()
    )
  );

-- Wedding owners can update
CREATE POLICY "Wedding owners can update their website"
  ON public.wedding_websites
  FOR UPDATE
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = auth.uid()
    )
  );

-- Collaborators can insert (editors)
CREATE POLICY "Collaborators can insert website"
  ON public.wedding_websites
  FOR INSERT
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE collaborator_emails @> ARRAY[auth.jwt()->>'email']
    )
  );

-- Collaborators can update (editors)
CREATE POLICY "Collaborators can update website"
  ON public.wedding_websites
  FOR UPDATE
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE collaborator_emails @> ARRAY[auth.jwt()->>'email']
    )
  );

CREATE TRIGGER update_wedding_websites_updated_at
  BEFORE UPDATE ON public.wedding_websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT SELECT ON public.wedding_websites TO anon;
GRANT SELECT, INSERT, UPDATE ON public.wedding_websites TO authenticated;

-- ============================================================
-- 2. Add has_website column to weddings table
-- ============================================================
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS has_website BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 3. Migrate existing page_config data to wedding_websites
-- All existing weddings with a non-empty page_config get migrated
-- and marked as legacy
-- ============================================================
INSERT INTO public.wedding_websites (wedding_id, page_config, is_legacy)
SELECT id, page_config, true
FROM public.weddings
WHERE page_config IS NOT NULL 
  AND page_config != '{}'::jsonb
  AND page_config != 'null'::jsonb
ON CONFLICT (wedding_id) DO NOTHING;

-- Update has_website flag for all migrated weddings
UPDATE public.weddings
SET has_website = true
WHERE id IN (SELECT wedding_id FROM public.wedding_websites);

-- ============================================================
-- 4. Create gift_subscriptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'deluxe')),
  purchaser_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchaser_email TEXT,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'mxn',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE SET NULL UNIQUE,
  redeem_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gift_redeemed_consistency CHECK (
    (wedding_id IS NULL) OR (redeemed_at IS NOT NULL AND status = 'redeemed')
  )
);

CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_code ON public.gift_subscriptions(code);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_status ON public.gift_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_purchaser ON public.gift_subscriptions(purchaser_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_wedding ON public.gift_subscriptions(wedding_id);

ALTER TABLE public.gift_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchasers can view their gift subscriptions"
  ON public.gift_subscriptions
  FOR SELECT
  USING (purchaser_user_id = auth.uid());

CREATE POLICY "Authenticated users can check gift code"
  ON public.gift_subscriptions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_gift_subscriptions_updated_at
  BEFORE UPDATE ON public.gift_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT SELECT ON public.gift_subscriptions TO authenticated;
