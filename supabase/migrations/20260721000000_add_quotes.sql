-- Superadmin quotes: custom price quotes sent to prospective clients
-- Each quote presents 1-4 pricing scenarios with a shared discount code

CREATE TABLE IF NOT EXISTS quotes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number      TEXT UNIQUE NOT NULL,
  recipient_name    TEXT NOT NULL,
  recipient_email   TEXT,
  notes             TEXT,

  -- JSONB array of scenarios:
  -- [{label, invitation_tier?, management_tier?,
  --   invitation_price_cents, management_price_cents, total_price_cents}]
  scenarios         JSONB NOT NULL DEFAULT '[]',

  -- Discount applied uniformly across all scenarios
  discount_type     TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value    INTEGER NOT NULL,

  -- Linked coupon (created in Stripe + local DB when the quote is generated)
  coupon_id         UUID REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_code       TEXT,
  coupon_expires_at TIMESTAMPTZ,

  -- Lifecycle
  status            TEXT NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'expired', 'cancelled')),

  -- Filled once a payment is made using this quote's coupon
  wedding_id        UUID REFERENCES weddings(id) ON DELETE SET NULL,

  created_by        UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status      ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by  ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_coupon_id   ON quotes(coupon_id);
CREATE INDEX IF NOT EXISTS idx_quotes_wedding_id  ON quotes(wedding_id) WHERE wedding_id IS NOT NULL;

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Superadmins: full CRUD
DROP POLICY IF EXISTS "superusers_quotes_all" ON quotes;
CREATE POLICY "superusers_quotes_all" ON quotes
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM superusers WHERE is_active = true)
  );

-- Service role: full access (webhooks may link quotes to weddings)
DROP POLICY IF EXISTS "service_role_quotes" ON quotes;
CREATE POLICY "service_role_quotes" ON quotes
  FOR ALL USING (auth.role() = 'service_role');

-- Public: read-only (shareable link access)
DROP POLICY IF EXISTS "public_view_quotes" ON quotes;
CREATE POLICY "public_view_quotes" ON quotes
  FOR SELECT USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION quotes_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quotes_updated_at ON quotes;
CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION quotes_set_updated_at();
