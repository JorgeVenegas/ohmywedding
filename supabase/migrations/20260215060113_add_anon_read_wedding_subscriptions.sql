-- Allow anonymous/public users to read wedding subscription plans
-- This is needed so public pages (like the registry) can check the wedding's plan
-- without requiring the visitor to be authenticated.

CREATE POLICY "Anyone can view wedding subscription plan"
  ON public.wedding_subscriptions
  FOR SELECT
  TO public
  USING (true);

GRANT SELECT ON public.wedding_subscriptions TO anon;
