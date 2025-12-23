-- Add triggers to automatically populate wedding_name_id from wedding_id
-- This ensures backward compatibility with existing queries

-- Function to sync wedding_name_id from wedding_id
CREATE OR REPLACE FUNCTION sync_wedding_name_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the wedding_name_id from the weddings table
  SELECT wedding_name_id INTO NEW.wedding_name_id
  FROM weddings
  WHERE id = NEW.wedding_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with wedding_id
CREATE TRIGGER sync_wedding_schedule_name_id
  BEFORE INSERT OR UPDATE ON wedding_schedule
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_guest_groups_name_id
  BEFORE INSERT OR UPDATE ON guest_groups
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_guests_name_id
  BEFORE INSERT OR UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_rsvps_name_id
  BEFORE INSERT OR UPDATE ON rsvps
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_gallery_albums_name_id
  BEFORE INSERT OR UPDATE ON gallery_albums
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_gallery_photos_name_id
  BEFORE INSERT OR UPDATE ON gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_wedding_faqs_name_id
  BEFORE INSERT OR UPDATE ON wedding_faqs
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_wedding_pages_name_id
  BEFORE INSERT OR UPDATE ON wedding_pages
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_gift_registries_name_id
  BEFORE INSERT OR UPDATE ON gift_registries
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_gift_items_name_id
  BEFORE INSERT OR UPDATE ON gift_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_custom_registry_items_name_id
  BEFORE INSERT OR UPDATE ON custom_registry_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_registry_contributions_name_id
  BEFORE INSERT OR UPDATE ON registry_contributions
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();

CREATE TRIGGER sync_images_name_id
  BEFORE INSERT OR UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION sync_wedding_name_id();
