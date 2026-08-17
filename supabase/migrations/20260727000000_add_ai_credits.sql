-- AI budget per wedding (cents, null = unlimited)
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS ai_budget_cents INTEGER DEFAULT NULL;

-- AI credit purchase history
CREATE TABLE IF NOT EXISTS public.ai_credit_purchases (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id                  UUID        NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  amount_cents                INTEGER     NOT NULL CHECK (amount_cents > 0),
  stripe_checkout_session_id  TEXT        UNIQUE,
  stripe_payment_intent_id    TEXT,
  status                      TEXT        NOT NULL DEFAULT 'pending'
                                          CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  granted_by                  UUID        REFERENCES auth.users(id),  -- set for manual grants
  note                        TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_credit_purchases_wedding_id
  ON public.ai_credit_purchases(wedding_id);

ALTER TABLE public.ai_credit_purchases ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ai_credit_purchases TO service_role;

-- Atomic increment of ai_budget_cents (initialises to 0 if null before adding)
CREATE OR REPLACE FUNCTION public.increment_ai_budget(p_wedding_id UUID, p_cents INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.weddings
  SET ai_budget_cents = COALESCE(ai_budget_cents, 0) + p_cents
  WHERE id = p_wedding_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ai_budget TO service_role;
