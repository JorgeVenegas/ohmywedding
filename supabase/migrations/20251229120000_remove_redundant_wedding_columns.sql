-- Remove redundant wedding_name_id columns from all tables
-- These now use wedding_id (UUID) for relationships
-- All dependencies (triggers, indexes, constraints, policies) have been removed in migration 20251229115900

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
