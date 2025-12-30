-- Update all RLS policies to use the get_current_user_email() function
-- instead of directly accessing auth.users

-- wedding_schedule
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage schedule" ON wedding_schedule;
CREATE POLICY "Wedding owners and collaborators can manage schedule" ON wedding_schedule
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- wedding_faqs
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage FAQs" ON wedding_faqs;
CREATE POLICY "Wedding owners and collaborators can manage FAQs" ON wedding_faqs
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- wedding_pages
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage pages" ON wedding_pages;
CREATE POLICY "Wedding owners and collaborators can manage pages" ON wedding_pages
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- gallery_albums
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage gallery" ON gallery_albums;
CREATE POLICY "Wedding owners and collaborators can manage gallery" ON gallery_albums
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- gallery_photos
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage photos" ON gallery_photos;
CREATE POLICY "Wedding owners and collaborators can manage photos" ON gallery_photos
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- gift_registries
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage registries" ON gift_registries;
CREATE POLICY "Wedding owners and collaborators can manage registries" ON gift_registries
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- gift_items
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage gift items" ON gift_items;
CREATE POLICY "Wedding owners and collaborators can manage gift items" ON gift_items
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- guest_groups
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage guest groups" ON guest_groups;
CREATE POLICY "Wedding owners and collaborators can manage guest groups" ON guest_groups
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- guests
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

-- rsvps
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage rsvps" ON rsvps;
CREATE POLICY "Wedding owners and collaborators can manage rsvps" ON rsvps
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- custom_registry_items
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage custom registry items" ON custom_registry_items;
CREATE POLICY "Wedding owners and collaborators can manage custom registry items" ON custom_registry_items
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- registry_contributions
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage registry contributions" ON registry_contributions;
CREATE POLICY "Wedding owners and collaborators can manage registry contributions" ON registry_contributions
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- images
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage images" ON images;
CREATE POLICY "Wedding owners and collaborators can manage images" ON images
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR public.get_current_user_email() = ANY(collaborator_emails)
    )
  );

-- weddings table
DROP POLICY IF EXISTS "Owners and collaborators can update weddings" ON weddings;
CREATE POLICY "Owners and collaborators can update weddings" ON weddings
  FOR UPDATE USING (
    owner_id IS NULL -- Allow editing unowned weddings
    OR owner_id = auth.uid() -- Owner can edit
    OR public.get_current_user_email() = ANY(collaborator_emails) -- Collaborators can edit
  );
