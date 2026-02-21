-- Migration: Create coupon management tables
-- Mirrors Stripe coupon/promotion code objects locally for superadmin management and redemption tracking

-- Coupons (maps to Stripe Coupon objects)
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  INTEGER NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'mxn',
  max_redemptions INTEGER,
  times_redeemed  INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  applies_to_plans TEXT[] NOT NULL DEFAULT '{premium,deluxe}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promotion Codes (user-facing code strings)
CREATE TABLE IF NOT EXISTS coupon_promotion_codes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id                UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  stripe_promotion_code_id TEXT UNIQUE NOT NULL,
  code                     TEXT UNIQUE NOT NULL,
  is_active                BOOLEAN NOT NULL DEFAULT true,
  max_redemptions          INTEGER,
  times_redeemed           INTEGER NOT NULL DEFAULT 0,
  first_time_transaction   BOOLEAN NOT NULL DEFAULT false,
  minimum_amount_cents     INTEGER,
  expires_at               TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupon Redemptions (tracks who redeemed what)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id                  UUID NOT NULL REFERENCES coupons(id),
  promotion_code_id          UUID REFERENCES coupon_promotion_codes(id),
  wedding_id                 UUID NOT NULL REFERENCES weddings(id),
  user_id                    UUID NOT NULL REFERENCES auth.users(id),
  subscription_order_id      UUID REFERENCES subscription_orders(id),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id   TEXT,
  discount_amount_cents      INTEGER NOT NULL DEFAULT 0,
  original_amount_cents      INTEGER NOT NULL DEFAULT 0,
  final_amount_cents         INTEGER NOT NULL DEFAULT 0,
  plan_type                  TEXT NOT NULL,
  status                     TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'completed', 'refunded')),
  redeemed_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_expires ON coupons(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_codes_coupon ON coupon_promotion_codes(coupon_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON coupon_promotion_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON coupon_promotion_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_wedding ON coupon_redemptions(wedding_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_order ON coupon_redemptions(subscription_order_id);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_promotion_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Superadmins: full access
CREATE POLICY "superusers_coupons_all" ON coupons
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM superusers WHERE is_active = true)
  );

CREATE POLICY "superusers_promo_codes_all" ON coupon_promotion_codes
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM superusers WHERE is_active = true)
  );

CREATE POLICY "superusers_redemptions_all" ON coupon_redemptions
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM superusers WHERE is_active = true)
  );

-- Service role: full access (for webhooks)
CREATE POLICY "service_role_coupons" ON coupons
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_promo_codes" ON coupon_promotion_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_redemptions" ON coupon_redemptions
  FOR ALL USING (auth.role() = 'service_role');

-- Users: can read active promotion codes (for validation)
CREATE POLICY "users_read_active_promo_codes" ON coupon_promotion_codes
  FOR SELECT USING (is_active = true);

-- Users: can read their own redemptions
CREATE POLICY "users_read_own_redemptions" ON coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);
