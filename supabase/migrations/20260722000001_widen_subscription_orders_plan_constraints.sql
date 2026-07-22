-- The from_plan/to_plan CHECK constraints only allowed legacy values
-- ('free', 'premium', 'deluxe'). The new two-axis checkout routes write
-- compound strings like 'basic+basic' or 'personalized+pro', causing the
-- subscription_orders INSERT to fail silently — no order row means fulfill
-- and the webhook can't activate the plan or mark the quote as paid.
-- Drop the constraints; these columns are reporting fields only, not structural.

ALTER TABLE subscription_orders DROP CONSTRAINT IF EXISTS subscription_orders_from_plan_check;
ALTER TABLE subscription_orders DROP CONSTRAINT IF EXISTS subscription_orders_to_plan_check;
