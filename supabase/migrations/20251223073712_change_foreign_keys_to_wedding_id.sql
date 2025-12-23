-- Migration to change all foreign keys from wedding_name_id to wedding_id
-- This ensures wedding_name_id can be changed without affecting related tables

-- Step 1: Add wedding_id column to all tables and populate it
ALTER TABLE wedding_schedule ADD COLUMN wedding_id uuid;
UPDATE wedding_schedule ws SET wedding_id = w.id FROM weddings w WHERE ws.wedding_name_id = w.wedding_name_id;
ALTER TABLE wedding_schedule ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE guest_groups ADD COLUMN wedding_id uuid;
UPDATE guest_groups gg SET wedding_id = w.id FROM weddings w WHERE gg.wedding_name_id = w.wedding_name_id;
ALTER TABLE guest_groups ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE guests ADD COLUMN wedding_id uuid;
UPDATE guests g SET wedding_id = w.id FROM weddings w WHERE g.wedding_name_id = w.wedding_name_id;
ALTER TABLE guests ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE rsvps ADD COLUMN wedding_id uuid;
UPDATE rsvps r SET wedding_id = w.id FROM weddings w WHERE r.wedding_name_id = w.wedding_name_id;
ALTER TABLE rsvps ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE gallery_albums ADD COLUMN wedding_id uuid;
UPDATE gallery_albums ga SET wedding_id = w.id FROM weddings w WHERE ga.wedding_name_id = w.wedding_name_id;
ALTER TABLE gallery_albums ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE gallery_photos ADD COLUMN wedding_id uuid;
UPDATE gallery_photos gp SET wedding_id = w.id FROM weddings w WHERE gp.wedding_name_id = w.wedding_name_id;
ALTER TABLE gallery_photos ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE wedding_faqs ADD COLUMN wedding_id uuid;
UPDATE wedding_faqs wf SET wedding_id = w.id FROM weddings w WHERE wf.wedding_name_id = w.wedding_name_id;
ALTER TABLE wedding_faqs ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE wedding_pages ADD COLUMN wedding_id uuid;
UPDATE wedding_pages wp SET wedding_id = w.id FROM weddings w WHERE wp.wedding_name_id = w.wedding_name_id;
ALTER TABLE wedding_pages ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE gift_registries ADD COLUMN wedding_id uuid;
UPDATE gift_registries gr SET wedding_id = w.id FROM weddings w WHERE gr.wedding_name_id = w.wedding_name_id;
ALTER TABLE gift_registries ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE gift_items ADD COLUMN wedding_id uuid;
UPDATE gift_items gi SET wedding_id = w.id FROM weddings w WHERE gi.wedding_name_id = w.wedding_name_id;
ALTER TABLE gift_items ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE custom_registry_items ADD COLUMN wedding_id uuid;
UPDATE custom_registry_items cri SET wedding_id = w.id FROM weddings w WHERE cri.wedding_name_id = w.wedding_name_id;
ALTER TABLE custom_registry_items ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE registry_contributions ADD COLUMN wedding_id uuid;
UPDATE registry_contributions rc SET wedding_id = w.id FROM weddings w WHERE rc.wedding_name_id = w.wedding_name_id;
ALTER TABLE registry_contributions ALTER COLUMN wedding_id SET NOT NULL;

ALTER TABLE images ADD COLUMN wedding_id uuid;
UPDATE images i SET wedding_id = w.id FROM weddings w WHERE i.wedding_name_id = w.wedding_name_id;
ALTER TABLE images ALTER COLUMN wedding_id SET NOT NULL;

-- Step 2: Drop old foreign key constraints (if they were named constraints)
-- Note: Some were inline references, not named constraints, so we'll handle those differently
ALTER TABLE wedding_schedule DROP CONSTRAINT IF EXISTS wedding_schedule_wedding_name_id_fkey;
ALTER TABLE guest_groups DROP CONSTRAINT IF EXISTS guest_groups_wedding_name_id_fkey;
ALTER TABLE guests DROP CONSTRAINT IF EXISTS guests_wedding_name_id_fkey;
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS rsvps_wedding_name_id_fkey;
ALTER TABLE gallery_albums DROP CONSTRAINT IF EXISTS gallery_albums_wedding_name_id_fkey;
ALTER TABLE gallery_photos DROP CONSTRAINT IF EXISTS gallery_photos_wedding_name_id_fkey;
ALTER TABLE wedding_faqs DROP CONSTRAINT IF EXISTS wedding_faqs_wedding_name_id_fkey;
ALTER TABLE wedding_pages DROP CONSTRAINT IF EXISTS wedding_pages_wedding_name_id_fkey;
ALTER TABLE gift_registries DROP CONSTRAINT IF EXISTS gift_registries_wedding_name_id_fkey;
ALTER TABLE gift_items DROP CONSTRAINT IF EXISTS gift_items_wedding_name_id_fkey;
ALTER TABLE custom_registry_items DROP CONSTRAINT IF EXISTS custom_registry_items_wedding_name_id_fkey;
ALTER TABLE registry_contributions DROP CONSTRAINT IF EXISTS registry_contributions_wedding_name_id_fkey;
ALTER TABLE images DROP CONSTRAINT IF EXISTS images_wedding_name_id_fkey;

-- Step 3: Drop old wedding_name_id columns (keep for now in case queries still use them)
-- We'll keep wedding_name_id columns for backward compatibility
-- ALTER TABLE wedding_schedule DROP COLUMN wedding_name_id;
-- ... (commented out - we can drop these later after updating all queries)

-- Step 4: Add new foreign key constraints
ALTER TABLE wedding_schedule ADD CONSTRAINT wedding_schedule_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE guest_groups ADD CONSTRAINT guest_groups_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE guests ADD CONSTRAINT guests_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE rsvps ADD CONSTRAINT rsvps_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE gallery_albums ADD CONSTRAINT gallery_albums_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE gallery_photos ADD CONSTRAINT gallery_photos_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE wedding_faqs ADD CONSTRAINT wedding_faqs_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE wedding_pages ADD CONSTRAINT wedding_pages_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE gift_registries ADD CONSTRAINT gift_registries_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE gift_items ADD CONSTRAINT gift_items_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE custom_registry_items ADD CONSTRAINT custom_registry_items_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE registry_contributions ADD CONSTRAINT registry_contributions_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

ALTER TABLE images ADD CONSTRAINT images_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE;

-- Step 5: Update indexes
DROP INDEX IF EXISTS idx_guests_ungrouped;
CREATE INDEX idx_guests_ungrouped ON guests (wedding_id) WHERE guest_group_id IS NULL;

DROP INDEX IF EXISTS idx_images_wedding;
CREATE INDEX idx_images_wedding ON images(wedding_id);
