-- Fix the wedding update policy to use correct syntax
-- Replace auth.jwt() with proper subquery

DROP POLICY IF EXISTS "Owners and collaborators can update weddings" ON weddings;

CREATE POLICY "Owners and collaborators can update weddings" ON weddings
  FOR UPDATE USING (
    owner_id IS NULL -- Allow editing unowned weddings
    OR owner_id = auth.uid() -- Owner can edit
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails) -- Collaborators can edit
  );
