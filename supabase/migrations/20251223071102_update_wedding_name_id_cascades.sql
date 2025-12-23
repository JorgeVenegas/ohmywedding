-- Add ON UPDATE CASCADE to all foreign key constraints referencing wedding_name_id
-- This allows changing the wedding_name_id and having it automatically update in all related tables

-- Drop and recreate foreign keys with ON UPDATE CASCADE

-- wedding_schedule
ALTER TABLE wedding_schedule DROP CONSTRAINT IF EXISTS wedding_schedule_wedding_name_id_fkey;
ALTER TABLE wedding_schedule 
  ADD CONSTRAINT wedding_schedule_wedding_name_id_fkey 
  FOREIGN KEY (wedding_name_id) 
  REFERENCES weddings(wedding_name_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- gift_registries
ALTER TABLE gift_registries DROP CONSTRAINT IF EXISTS gift_registries_wedding_name_id_fkey;
ALTER TABLE gift_registries 
  ADD CONSTRAINT gift_registries_wedding_name_id_fkey 
  FOREIGN KEY (wedding_name_id) 
  REFERENCES weddings(wedding_name_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- gift_items
ALTER TABLE gift_items DROP CONSTRAINT IF EXISTS gift_items_wedding_name_id_fkey;
ALTER TABLE gift_items 
  ADD CONSTRAINT gift_items_wedding_name_id_fkey 
  FOREIGN KEY (wedding_name_id) 
  REFERENCES weddings(wedding_name_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- custom_registry_items
ALTER TABLE custom_registry_items DROP CONSTRAINT IF EXISTS custom_registry_items_wedding_name_id_fkey;
ALTER TABLE custom_registry_items 
  ADD CONSTRAINT custom_registry_items_wedding_name_id_fkey 
  FOREIGN KEY (wedding_name_id) 
  REFERENCES weddings(wedding_name_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- registry_contributions
ALTER TABLE registry_contributions DROP CONSTRAINT IF EXISTS registry_contributions_wedding_name_id_fkey;
ALTER TABLE registry_contributions 
  ADD CONSTRAINT registry_contributions_wedding_name_id_fkey 
  FOREIGN KEY (wedding_name_id) 
  REFERENCES weddings(wedding_name_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- gallery_albums
ALTER TABLE gallery_albums DROP CONSTRAINT IF EXISTS gallery_albums_wedding_name_id_fkey;
ALTER TABLE gallery_albums 
  ADD CONSTRAINT gallery_albums_wedding_name_id_fkey 
  FOREIGN KEY (wedding_name_id) 
  REFERENCES weddings(wedding_name_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- gallery_photos
ALTER TABLE gallery_photos DROP CONSTRAINT IF EXISTS gallery_photos_wedding_name_id_fkey;
ALTER TABLE gallery_photos 
  ADD CONSTRAINT gallery_photos_wedding_name_id_fkey 
  FOREIGN KEY (wedding_name_id) 
  REFERENCES weddings(wedding_name_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
