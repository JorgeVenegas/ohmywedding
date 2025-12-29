-- Remove redundant wedding_name_id columns from all tables
-- These now use wedding_id (UUID) for relationships

-- Drop indexes on wedding_name_id first
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

-- Drop wedding_name_id columns from all tables
ALTER TABLE "guest_groups" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "guests" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "rsvps" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "wedding_schedule" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "gallery_albums" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "gallery_photos" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "wedding_faqs" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "wedding_pages" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "gift_registries" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "gift_items" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "custom_registry_items" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "registry_contributions" DROP COLUMN IF EXISTS "wedding_name_id";
ALTER TABLE "images" DROP COLUMN IF EXISTS "wedding_name_id";
