-- Subscription Orders Table
-- One row per upgrade attempt lifecycle. Tracks the full funnel
-- from upgrade page visit through payment completion.
-- Replaces the old subscription_payments + subscription_leads tables.

CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who and what (wedding_id nullable — unknown on initial page visit)
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source attribution
  source TEXT NOT NULL DEFAULT 'direct',

  -- Plan transition (nullable — user may not have selected yet)
  from_plan TEXT DEFAULT 'free' CHECK (from_plan IS NULL OR from_plan IN ('free', 'premium')),
  to_plan TEXT CHECK (to_plan IS NULL OR to_plan IN ('premium', 'deluxe')),

  -- Stripe identifiers
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,

  -- Payment details
  amount_cents INTEGER,
  currency TEXT DEFAULT 'mxn',

  -- Current status — full lifecycle from visit to completion
  status TEXT NOT NULL DEFAULT 'visited' CHECK (status IN (
    'visited',           -- User landed on the upgrade page
    'checkout_started',  -- Checkout session created, redirecting to Stripe
    'requires_action',   -- Bank transfer instructions sent, awaiting payment
    'completed',         -- Payment succeeded, subscription activated
    'failed',            -- Payment failed
    'expired',           -- Payment expired
    'refunded',          -- Payment refunded
    'abandoned'          -- Never completed (future cleanup)
  )),

  -- Stage timestamps (each set once as the order progresses)
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_started_at TIMESTAMPTZ,
  action_required_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Link to created subscription
  wedding_subscription_id UUID REFERENCES public.wedding_subscriptions(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_orders_wedding_id ON public.subscription_orders(wedding_id);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_user_id ON public.subscription_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_source ON public.subscription_orders(source);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_status ON public.subscription_orders(status);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_to_plan ON public.subscription_orders(to_plan);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_visited_at ON public.subscription_orders(visited_at);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_checkout_session ON public.subscription_orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_payment_intent ON public.subscription_orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_funnel ON public.subscription_orders(source, to_plan, visited_at);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_created_at ON public.subscription_orders(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_subscription_orders_updated_at
  BEFORE UPDATE ON public.subscription_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;

-- Superadmins can view all orders
CREATE POLICY "Superadmins can view all subscription orders"
  ON public.subscription_orders
  FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.superusers WHERE is_active = true)
  );

-- Users can view their own orders
CREATE POLICY "Users can view own subscription orders"
  ON public.subscription_orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own orders (from upgrade page)
CREATE POLICY "Users can insert own subscription orders"
  ON public.subscription_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (plan/wedding selection)
CREATE POLICY "Users can update own subscription orders"
  ON public.subscription_orders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all orders (webhooks + checkout API)
CREATE POLICY "Service role can manage subscription orders"
  ON public.subscription_orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.subscription_orders TO authenticated;
GRANT ALL ON public.subscription_orders TO service_role;
