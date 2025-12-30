-- Drop the old images policy that depends on wedding_name_id
-- This was missed in the previous migration

DROP POLICY IF EXISTS "Wedding owners can manage images" ON images;
