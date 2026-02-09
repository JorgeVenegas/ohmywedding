-- Update subscription_leads to support early funnel tracking
-- Leads are now created when a user visits the upgrade page, not at checkout

-- 1. Make wedding_id nullable (unknown on initial page visit)
ALTER TABLE public.subscription_leads ALTER COLUMN wedding_id DROP NOT NULL;

-- 2. Make to_plan nullable (user hasn't selected a plan yet)
ALTER TABLE public.subscription_leads ALTER COLUMN to_plan DROP NOT NULL;

-- 3. Make from_plan nullable and update its CHECK constraint
ALTER TABLE public.subscription_leads ALTER COLUMN from_plan DROP NOT NULL;
ALTER TABLE public.subscription_leads DROP CONSTRAINT IF EXISTS subscription_leads_from_plan_check;
ALTER TABLE public.subscription_leads ADD CONSTRAINT subscription_leads_from_plan_check
  CHECK (from_plan IS NULL OR from_plan IN ('free', 'premium'));

-- 4. Update to_plan CHECK to allow NULL
ALTER TABLE public.subscription_leads DROP CONSTRAINT IF EXISTS subscription_leads_to_plan_check;
ALTER TABLE public.subscription_leads ADD CONSTRAINT subscription_leads_to_plan_check
  CHECK (to_plan IS NULL OR to_plan IN ('premium', 'deluxe'));

-- 5. Update status CHECK with new statuses
ALTER TABLE public.subscription_leads DROP CONSTRAINT IF EXISTS subscription_leads_status_check;
ALTER TABLE public.subscription_leads ADD CONSTRAINT subscription_leads_status_check
  CHECK (status IN (
    'visited',           -- User landed on upgrade page
    'plan_selected',     -- User selected a specific plan
    'checkout_started',  -- Checkout session created
    'checkout_completed',-- Stripe checkout session completed
    'processing',        -- Payment intent created
    'requires_action',   -- Bank transfer / 3D Secure pending
    'completed',         -- Payment succeeded
    'failed',            -- Payment failed
    'abandoned',         -- Never completed
    'started'            -- Legacy (keep for backward compat)
  ));

-- 6. Add new timestamp columns
ALTER TABLE public.subscription_leads ADD COLUMN IF NOT EXISTS visited_at TIMESTAMPTZ;
ALTER TABLE public.subscription_leads ADD COLUMN IF NOT EXISTS plan_selected_at TIMESTAMPTZ;
ALTER TABLE public.subscription_leads ADD COLUMN IF NOT EXISTS checkout_started_at TIMESTAMPTZ;

-- 7. Backfill: set visited_at from started_at for existing rows
UPDATE public.subscription_leads SET visited_at = started_at WHERE visited_at IS NULL;

-- 8. Update default status from 'started' to 'visited'
ALTER TABLE public.subscription_leads ALTER COLUMN status SET DEFAULT 'visited';

-- 9. Update index to use visited_at instead of started_at
DROP INDEX IF EXISTS idx_subscription_leads_started_at;
CREATE INDEX IF NOT EXISTS idx_subscription_leads_visited_at ON public.subscription_leads(visited_at);

DROP INDEX IF EXISTS idx_subscription_leads_funnel;
CREATE INDEX IF NOT EXISTS idx_subscription_leads_funnel ON public.subscription_leads(source, to_plan, visited_at);

-- 10. Add RLS policies for user insert/update (needed for client-side lead tracking)
CREATE POLICY "Users can insert own subscription leads"
  ON public.subscription_leads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription leads"
  ON public.subscription_leads
  FOR UPDATE
  USING (auth.uid() = user_id);
