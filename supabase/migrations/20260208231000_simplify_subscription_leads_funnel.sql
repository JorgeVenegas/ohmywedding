-- Simplify subscription_leads funnel stages
-- Remove redundant statuses: plan_selected, checkout_completed, processing
-- New funnel: visited -> checkout_started -> requires_action -> completed

-- 1. Migrate existing rows in intermediate statuses to the closest valid status
UPDATE public.subscription_leads SET status = 'visited' WHERE status = 'plan_selected';
UPDATE public.subscription_leads SET status = 'checkout_started' WHERE status IN ('checkout_completed', 'processing');
UPDATE public.subscription_leads SET status = 'checkout_started' WHERE status = 'started';

-- 2. Update status CHECK constraint
ALTER TABLE public.subscription_leads DROP CONSTRAINT IF EXISTS subscription_leads_status_check;
ALTER TABLE public.subscription_leads ADD CONSTRAINT subscription_leads_status_check
  CHECK (status IN (
    'visited',           -- User landed on upgrade page
    'checkout_started',  -- Checkout session created
    'requires_action',   -- Bank transfer pending
    'completed',         -- Payment succeeded
    'failed',            -- Payment failed
    'abandoned'          -- Never completed
  ));

-- 3. Drop unused timestamp columns (data preserved in updated_at if needed)
ALTER TABLE public.subscription_leads DROP COLUMN IF EXISTS plan_selected_at;
ALTER TABLE public.subscription_leads DROP COLUMN IF EXISTS checkout_completed_at;
ALTER TABLE public.subscription_leads DROP COLUMN IF EXISTS payment_created_at;
ALTER TABLE public.subscription_leads DROP COLUMN IF EXISTS started_at;
