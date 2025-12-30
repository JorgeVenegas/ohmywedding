-- Fix guest management policy to use get_current_user_email() function
-- This ensures RLS policies work correctly for authenticated users

DROP POLICY IF EXISTS "Wedding owners and collaborators can manage guests" ON guests;

CREATE POLICY "Wedding owners and collaborators can manage guests" ON guests
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );
