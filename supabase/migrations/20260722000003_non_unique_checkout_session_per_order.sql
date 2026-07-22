-- The quote checkout creates one subscription_orders row per axis (invitation +
-- management) in a single Stripe session. Both rows carry the same
-- stripe_checkout_session_id, which violates the UNIQUE constraint added in the
-- original migration. The webhook and fulfill endpoint already query with .eq()
-- and handle multiple rows per session, so uniqueness here is wrong.
-- Replace the unique constraint with a plain index.

ALTER TABLE subscription_orders
  DROP CONSTRAINT IF EXISTS subscription_orders_stripe_checkout_session_id_key;

CREATE INDEX IF NOT EXISTS idx_subscription_orders_checkout_session
  ON subscription_orders (stripe_checkout_session_id);
