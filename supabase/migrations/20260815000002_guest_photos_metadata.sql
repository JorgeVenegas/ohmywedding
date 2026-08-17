-- Add metadata JSONB column to store EXIF data extracted client-side at upload time
-- Stores: taken_at, location { lat, lon, city }, camera { make, model },
--         dimensions { width, height }, exif_raw (select fields)
alter table guest_photos add column if not exists metadata jsonb;
