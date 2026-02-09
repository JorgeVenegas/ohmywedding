-- Allow superadmins to view subscription events (for funnel analytics)
-- This policy was already correct, just documenting it here for clarity

-- Drop the old policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Superadmins can view all subscription events" ON public.subscription_events;

-- Recreate with same logic
CREATE POLICY "Superadmins can view all subscription events"
  ON public.subscription_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.superusers
    )
  );
