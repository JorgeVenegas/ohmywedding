-- The Stripe webhook activates purchases by reading wedding_id/plan back off the
-- matching subscription_orders row (session/PI metadata isn't reliably available
-- at webhook time) — so the new axis+tier checkout flow needs to write one too.
-- Add nullable axis/tier columns, and widen the legacy from_plan/to_plan CHECK
-- constraints so the derived legacy plan (see deriveLegacyPlan) can always be
-- stored, even for combinations the old single-ladder checkout never produced
-- (e.g. from_plan='deluxe' when a wedding already has Bespoke Invitation and is
-- now buying Management Agency).

ALTER TABLE subscription_orders
  ADD COLUMN IF NOT EXISTS axis TEXT CHECK (axis IS NULL OR axis IN ('invitation', 'management')),
  ADD COLUMN IF NOT EXISTS tier TEXT;

ALTER TABLE subscription_orders DROP CONSTRAINT IF EXISTS subscription_orders_from_plan_check;
ALTER TABLE subscription_orders
  ADD CONSTRAINT subscription_orders_from_plan_check
  CHECK (from_plan IS NULL OR from_plan IN ('free', 'premium', 'deluxe'));

ALTER TABLE subscription_orders DROP CONSTRAINT IF EXISTS subscription_orders_to_plan_check;
ALTER TABLE subscription_orders
  ADD CONSTRAINT subscription_orders_to_plan_check
  CHECK (to_plan IS NULL OR to_plan IN ('free', 'premium', 'deluxe'));
