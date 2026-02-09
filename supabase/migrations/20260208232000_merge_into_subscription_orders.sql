-- Merge subscription_leads + subscription_payments into subscription_orders
-- One unified table for the full upgrade lifecycle

-- 1. Create the new table
CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'direct',
  from_plan TEXT DEFAULT 'free' CHECK (from_plan IS NULL OR from_plan IN ('free', 'premium')),
  to_plan TEXT CHECK (to_plan IS NULL OR to_plan IN ('premium', 'deluxe')),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'mxn',
  status TEXT NOT NULL DEFAULT 'visited' CHECK (status IN (
    'visited', 'checkout_started', 'requires_action', 'completed',
    'failed', 'expired', 'refunded', 'abandoned'
  )),
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_started_at TIMESTAMPTZ,
  action_required_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  wedding_subscription_id UUID REFERENCES public.wedding_subscriptions(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Migrate data from subscription_leads (primary source — has full funnel)
INSERT INTO public.subscription_orders (
  id, wedding_id, user_id, source, from_plan, to_plan,
  stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id,
  amount_cents, currency, status,
  visited_at, checkout_started_at, action_required_at, completed_at, failed_at,
  wedding_subscription_id, metadata, created_at, updated_at
)
SELECT
  l.id, l.wedding_id, l.user_id, l.source, l.from_plan, l.to_plan,
  l.stripe_checkout_session_id, l.stripe_payment_intent_id, l.stripe_customer_id,
  COALESCE(l.amount_cents, p.amount_cents), COALESCE(l.currency, p.currency, 'mxn'),
  -- Use the more advanced status between leads and payments
  CASE
    WHEN p.status = 'completed' OR l.status = 'completed' THEN 'completed'
    WHEN p.status = 'failed' OR l.status = 'failed' THEN 'failed'
    WHEN p.status = 'requires_action' OR l.status = 'requires_action' THEN 'requires_action'
    WHEN p.status IS NOT NULL AND p.status != 'pending' THEN p.status
    ELSE l.status
  END,
  l.visited_at, l.checkout_started_at, l.action_required_at,
  COALESCE(l.completed_at, p.completed_at),
  l.failed_at,
  COALESCE(l.wedding_subscription_id, p.wedding_subscription_id),
  COALESCE(l.metadata, p.metadata, '{}'),
  l.created_at, GREATEST(l.updated_at, p.updated_at, l.updated_at)
FROM public.subscription_leads l
LEFT JOIN public.subscription_payments p
  ON l.stripe_checkout_session_id = p.stripe_checkout_session_id;

-- 3. Insert any orphaned payments that don't have a matching lead
INSERT INTO public.subscription_orders (
  wedding_id, user_id, source, to_plan,
  stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id,
  amount_cents, currency, status,
  visited_at, checkout_started_at, completed_at,
  wedding_subscription_id, metadata, created_at, updated_at
)
SELECT
  p.wedding_id, p.user_id,
  COALESCE(p.metadata->>'source', 'direct'),
  p.plan_type,
  p.stripe_checkout_session_id, p.stripe_payment_intent_id, p.stripe_customer_id,
  p.amount_cents, p.currency,
  CASE
    WHEN p.status = 'pending' THEN 'checkout_started'
    WHEN p.status = 'processing' THEN 'checkout_started'
    ELSE p.status
  END,
  p.created_at,  -- visited_at = created_at for orphaned payments
  p.created_at,  -- checkout_started_at = created_at
  p.completed_at,
  p.wedding_subscription_id, p.metadata, p.created_at, p.updated_at
FROM public.subscription_payments p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_leads l
  WHERE l.stripe_checkout_session_id = p.stripe_checkout_session_id
);

-- 4. Indexes
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

-- 5. Trigger for updated_at
CREATE TRIGGER set_subscription_orders_updated_at
  BEFORE UPDATE ON public.subscription_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view all subscription orders"
  ON public.subscription_orders FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.superusers WHERE is_active = true));

CREATE POLICY "Users can view own subscription orders"
  ON public.subscription_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription orders"
  ON public.subscription_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription orders"
  ON public.subscription_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription orders"
  ON public.subscription_orders FOR ALL
  USING (true) WITH CHECK (true);

-- 7. Grant permissions
GRANT SELECT ON public.subscription_orders TO authenticated;
GRANT ALL ON public.subscription_orders TO service_role;

-- 8. Drop old tables
DROP TABLE IF EXISTS public.subscription_leads CASCADE;
DROP TABLE IF EXISTS public.subscription_payments CASCADE;
