-- Remove all dependencies on wedding_name_id columns before dropping them
-- This migration removes triggers, functions, indexes, constraints, and policies
-- that reference wedding_name_id columns

-- ============================================
-- 1. Drop all triggers that sync wedding_name_id
-- ============================================
DROP TRIGGER IF EXISTS sync_wedding_schedule_name_id ON wedding_schedule;
DROP TRIGGER IF EXISTS sync_guest_groups_name_id ON guest_groups;
DROP TRIGGER IF EXISTS sync_guests_name_id ON guests;
DROP TRIGGER IF EXISTS sync_rsvps_name_id ON rsvps;
DROP TRIGGER IF EXISTS sync_gallery_albums_name_id ON gallery_albums;
DROP TRIGGER IF EXISTS sync_gallery_photos_name_id ON gallery_photos;
DROP TRIGGER IF EXISTS sync_wedding_faqs_name_id ON wedding_faqs;
DROP TRIGGER IF EXISTS sync_wedding_pages_name_id ON wedding_pages;
DROP TRIGGER IF EXISTS sync_gift_registries_name_id ON gift_registries;
DROP TRIGGER IF EXISTS sync_gift_items_name_id ON gift_items;
DROP TRIGGER IF EXISTS sync_custom_registry_items_name_id ON custom_registry_items;
DROP TRIGGER IF EXISTS sync_registry_contributions_name_id ON registry_contributions;
DROP TRIGGER IF EXISTS sync_images_name_id ON images;

-- ============================================
-- 2. Drop the sync function
-- ============================================
DROP FUNCTION IF EXISTS sync_wedding_name_id();

-- ============================================
-- 3. Drop all indexes on wedding_name_id
-- ============================================
DROP INDEX IF EXISTS "idx_guest_groups_wedding_name_id";
DROP INDEX IF EXISTS "idx_guests_wedding_name_id";
DROP INDEX IF EXISTS "idx_rsvps_wedding_name_id";
DROP INDEX IF EXISTS "idx_gallery_albums_wedding_name_id";
DROP INDEX IF EXISTS "idx_gallery_photos_wedding_name_id";
DROP INDEX IF EXISTS "idx_wedding_faqs_wedding_name_id";
DROP INDEX IF EXISTS "idx_wedding_pages_wedding_name_id";
DROP INDEX IF EXISTS "idx_gift_registries_wedding_name_id";
DROP INDEX IF EXISTS "idx_gift_items_wedding_name_id";
DROP INDEX IF EXISTS "idx_wedding_schedule_wedding_name_id";
DROP INDEX IF EXISTS "idx_custom_registry_items_wedding_name_id";
DROP INDEX IF EXISTS "idx_registry_contributions_wedding_name_id";
DROP INDEX IF EXISTS "idx_images_wedding_name_id";

-- Drop the ungrouped guests index (it uses wedding_name_id)
DROP INDEX IF EXISTS "idx_guests_ungrouped";

-- ============================================
-- 4. Drop all foreign key constraints on wedding_name_id
-- ============================================
ALTER TABLE "guest_groups" DROP CONSTRAINT IF EXISTS "guest_groups_wedding_name_id_fkey";
ALTER TABLE "guests" DROP CONSTRAINT IF EXISTS "guests_wedding_name_id_fkey";
ALTER TABLE "rsvps" DROP CONSTRAINT IF EXISTS "rsvps_wedding_name_id_fkey";
ALTER TABLE "wedding_schedule" DROP CONSTRAINT IF EXISTS "wedding_schedule_wedding_name_id_fkey";
ALTER TABLE "gallery_albums" DROP CONSTRAINT IF EXISTS "gallery_albums_wedding_name_id_fkey";
ALTER TABLE "gallery_photos" DROP CONSTRAINT IF EXISTS "gallery_photos_wedding_name_id_fkey";
ALTER TABLE "wedding_faqs" DROP CONSTRAINT IF EXISTS "wedding_faqs_wedding_name_id_fkey";
ALTER TABLE "wedding_pages" DROP CONSTRAINT IF EXISTS "wedding_pages_wedding_name_id_fkey";
ALTER TABLE "gift_registries" DROP CONSTRAINT IF EXISTS "gift_registries_wedding_name_id_fkey";
ALTER TABLE "gift_items" DROP CONSTRAINT IF EXISTS "gift_items_wedding_name_id_fkey";
ALTER TABLE "custom_registry_items" DROP CONSTRAINT IF EXISTS "custom_registry_items_wedding_name_id_fkey";
ALTER TABLE "registry_contributions" DROP CONSTRAINT IF EXISTS "registry_contributions_wedding_name_id_fkey";
ALTER TABLE "images" DROP CONSTRAINT IF EXISTS "images_wedding_name_id_fkey";

-- ============================================
-- 5. Update RLS policies to use wedding_id instead of wedding_name_id
-- ============================================

-- wedding_schedule
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage schedule" ON wedding_schedule;
CREATE POLICY "Wedding owners and collaborators can manage schedule" ON wedding_schedule
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings 
      WHERE owner_id = auth.uid() 
        OR owner_id IS NULL
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
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
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
    )
  );

-- images (if it exists and has policies)
DROP POLICY IF EXISTS "Wedding owners and collaborators can manage images" ON images;
DROP POLICY IF EXISTS "Wedding owners can manage images" ON images;
-- Only create the policy if the images table exists and has wedding_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'images' AND column_name = 'wedding_id'
  ) THEN
    EXECUTE 'CREATE POLICY "Wedding owners and collaborators can manage images" ON images
      FOR ALL USING (
        wedding_id IN (
          SELECT id FROM weddings 
          WHERE owner_id = auth.uid() 
            OR owner_id IS NULL
            OR (SELECT email FROM auth.users WHERE id = auth.uid()) = ANY(collaborator_emails)
        )
      )';
  END IF;
END $$;

-- ============================================
-- 6. Recreate the ungrouped guests index using wedding_id
-- ============================================
CREATE INDEX IF NOT EXISTS "idx_guests_ungrouped" ON guests (wedding_id) WHERE guest_group_id IS NULL;
