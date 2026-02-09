-- Subscription Payments Table
-- Tracks payment lifecycle for subscription upgrades (similar to registry_contributions)

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  wedding_subscription_id UUID REFERENCES public.wedding_subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe identifiers
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  
  -- Payment details
  plan_type TEXT NOT NULL CHECK (plan_type IN ('premium', 'deluxe')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'mxn',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',        -- checkout created, awaiting payment
    'processing',     -- payment intent created
    'requires_action', -- bank transfer / 3D secure needed
    'completed',      -- payment succeeded
    'failed',         -- payment failed
    'expired',        -- session expired without payment
    'refunded'        -- payment was refunded
  )),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_wedding_id ON public.subscription_payments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_stripe_pi ON public.subscription_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_created_at ON public.subscription_payments(created_at DESC);

-- Enable RLS
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own subscription payments"
  ON public.subscription_payments
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage all payments (for webhooks)
CREATE POLICY "Service role can manage subscription payments"
  ON public.subscription_payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Superadmins can view all payments
CREATE POLICY "Superadmins can view all subscription payments"
  ON public.subscription_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.superusers 
      WHERE superusers.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.subscription_payments TO authenticated;
GRANT ALL ON public.subscription_payments TO service_role;
