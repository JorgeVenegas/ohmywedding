-- Add is_locked and locked_at fields to weddings table
-- Locked weddings redirect all visitors to the /wedding-locked page
-- Weddings without a plan are auto-locked by the cron job after 24 hours

ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;

-- Index for the cron job: find weddings eligible for auto-locking
-- (no subscription, created >24h ago, not yet locked)
CREATE INDEX IF NOT EXISTS idx_weddings_is_locked ON public.weddings (is_locked)
  WHERE is_locked = FALSE;
