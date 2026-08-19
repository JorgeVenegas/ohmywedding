-- Expand gift_subscriptions.plan to support management gift types.
-- Existing values 'premium' (invitation/personalized) and 'deluxe' (invitation/bespoke)
-- are kept as-is. New values for management axis: management_pro, management_agency.

-- Drop and recreate the plan check constraint with the expanded value set.
ALTER TABLE public.gift_subscriptions
  DROP CONSTRAINT IF EXISTS gift_subscriptions_plan_check;

ALTER TABLE public.gift_subscriptions
  ADD CONSTRAINT gift_subscriptions_plan_check
  CHECK (plan IN ('invitation_basic', 'premium', 'deluxe', 'management_basic', 'management_pro', 'management_agency'));
