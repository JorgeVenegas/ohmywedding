-- Create subscription_leads table (replaces subscription_events)
-- One row per lead = one upgrade attempt lifecycle
-- Stage timestamps track progression through the funnel

CREATE TABLE IF NOT EXISTS public.subscription_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who and what
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source attribution
  source TEXT NOT NULL DEFAULT 'direct',
  
  -- Plan transition
  from_plan TEXT NOT NULL DEFAULT 'free' CHECK (from_plan IN ('free', 'premium')),
  to_plan TEXT NOT NULL CHECK (to_plan IN ('premium', 'deluxe')),
  
  -- Stripe identifiers (populated as the lead progresses)
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  
  -- Payment details
  amount_cents INTEGER,
  currency TEXT DEFAULT 'mxn',
  
  -- Current status
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN (
    'started',         -- User initiated checkout
    'checkout_completed', -- Stripe checkout session completed
    'processing',      -- Payment intent created
    'requires_action', -- Bank transfer / 3D Secure pending
    'completed',       -- Payment succeeded, subscription activated
    'failed',          -- Payment failed
    'abandoned'        -- Never completed checkout (future cleanup)
  )),
  
  -- Stage timestamps (each set once as the lead progresses)
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_completed_at TIMESTAMPTZ,
  payment_created_at TIMESTAMPTZ,
  action_required_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Link to the created subscription (set on completion)
  wedding_subscription_id UUID REFERENCES public.wedding_subscriptions(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscription_leads_wedding_id ON public.subscription_leads(wedding_id);
CREATE INDEX IF NOT EXISTS idx_subscription_leads_user_id ON public.subscription_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_leads_source ON public.subscription_leads(source);
CREATE INDEX IF NOT EXISTS idx_subscription_leads_status ON public.subscription_leads(status);
CREATE INDEX IF NOT EXISTS idx_subscription_leads_to_plan ON public.subscription_leads(to_plan);
CREATE INDEX IF NOT EXISTS idx_subscription_leads_started_at ON public.subscription_leads(started_at);
CREATE INDEX IF NOT EXISTS idx_subscription_leads_checkout_session ON public.subscription_leads(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_subscription_leads_payment_intent ON public.subscription_leads(stripe_payment_intent_id);

-- Composite index for funnel aggregation queries
CREATE INDEX IF NOT EXISTS idx_subscription_leads_funnel ON public.subscription_leads(source, to_plan, started_at);

-- Auto-update updated_at
CREATE TRIGGER set_subscription_leads_updated_at
  BEFORE UPDATE ON public.subscription_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscription_leads ENABLE ROW LEVEL SECURITY;

-- Superadmins can view all leads (for analytics dashboard)
CREATE POLICY "Superadmins can view all subscription leads"
  ON public.subscription_leads
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.superusers WHERE is_active = true)
  );

-- Users can see their own leads
CREATE POLICY "Users can view own subscription leads"
  ON public.subscription_leads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all leads (from webhooks + checkout API)
CREATE POLICY "Service role can manage subscription leads"
  ON public.subscription_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Drop the old subscription_events table
DROP TABLE IF EXISTS public.subscription_events;
