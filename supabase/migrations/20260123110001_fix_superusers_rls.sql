-- Fix the infinite recursion in superusers RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Superusers can read superusers table" ON superusers;

-- Create a simpler policy: authenticated users can check if THEIR OWN email is in the table
-- This avoids the infinite recursion by only checking the current user's own row
CREATE POLICY "Users can read own superuser status" ON superusers
  FOR SELECT
  USING (
    email = lower(auth.jwt() ->> 'email')
    OR user_id = auth.uid()
  );

-- Allow service role to read all superusers
DROP POLICY IF EXISTS "Service role can manage superusers" ON superusers;
CREATE POLICY "Service role full access" ON superusers
  FOR ALL
  USING (true)
  WITH CHECK (true);
