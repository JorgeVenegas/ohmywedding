-- Track subscription checkout and payment events for funnel analytics
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event type tracking the funnel stages
  event_type TEXT NOT NULL CHECK (event_type IN (
    'payment_intent_created',             -- Stripe created payment intent
    'payment_intent_requires_action',     -- Bank transfer or 3D Secure needed
    'checkout_session_completed',         -- Payment completed
    'payment_intent_succeeded',           -- Payment confirmed
    'payment_intent_payment_failed'       -- Payment failed
  )),
  
  -- Stripe identifiers
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  
  -- Metadata from checkout
  plan_type TEXT CHECK (plan_type IN ('premium', 'deluxe')),
  user_id UUID,
  
  -- Bank transfer specific
  client_secret TEXT,
  next_action_type TEXT,  -- e.g., 'use_stripe_sdk', 'redirect_to_url'
  
  -- Event details
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  metadata JSONB,
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- For tracking completion time in funnel
  completed_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON public.subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_plan_type ON public.subscription_events(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON public.subscription_events(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_events_session_id ON public.subscription_events(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_payment_intent_id ON public.subscription_events(stripe_payment_intent_id);

-- Enable RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view subscription events (for analytics dashboard)
CREATE POLICY "Superadmins can view all subscription events"
  ON public.subscription_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.superusers
    )
  );

-- Service role can insert events (from webhooks)
CREATE POLICY "Service role can insert subscription events"
  ON public.subscription_events
  FOR INSERT
  WITH CHECK (true);

-- Service role can update events (to mark completed)
CREATE POLICY "Service role can update subscription events"
  ON public.subscription_events
  FOR UPDATE
  USING (true);
