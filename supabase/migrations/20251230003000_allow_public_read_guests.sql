-- Update RLS policies to allow public read access to guests
-- But restrict insert/update/delete to authenticated wedding owners and collaborators only

-- Drop existing policies
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage guests" ON guests;
DROP POLICY IF EXISTS "Anyone can view guests" ON guests;
DROP POLICY IF EXISTS "Public read access for guests" ON guests;

-- Allow anyone to read guests data (for RSVP pages)
CREATE POLICY "Anyone can view guests" ON guests
  FOR SELECT USING (true);

-- Only wedding owners and collaborators can insert/update/delete
CREATE POLICY "Wedding owners and collaborators can manage guests" ON guests
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- Similarly for guest_groups
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage guest groups" ON guest_groups;
DROP POLICY IF EXISTS "Anyone can view guest groups" ON guest_groups;
DROP POLICY IF EXISTS "Public read access for guest groups" ON guest_groups;

CREATE POLICY "Anyone can view guest groups" ON guest_groups
  FOR SELECT USING (true);

CREATE POLICY "Wedding owners and collaborators can manage guest groups" ON guest_groups
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );
