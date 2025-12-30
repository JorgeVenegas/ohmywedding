-- Add wedding_name_id back to weddings table
-- This column should remain in the weddings table as it's the human-readable identifier
-- It was incorrectly removed in migration 20251229120000

-- Only add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weddings' AND column_name = 'wedding_name_id'
  ) THEN
    ALTER TABLE "weddings" ADD COLUMN "wedding_name_id" text;
    
    -- Update existing rows to populate wedding_name_id from date_id
    UPDATE "weddings" 
    SET "wedding_name_id" = "date_id" 
    WHERE "wedding_name_id" IS NULL;
    
    -- Make it NOT NULL after populating
    ALTER TABLE "weddings" ALTER COLUMN "wedding_name_id" SET NOT NULL;
  END IF;
END $$;

-- Fix any duplicate wedding_name_id values by appending row number
DO $$
DECLARE
  dup_rec RECORD;
  row_rec RECORD;
  counter INT;
BEGIN
  FOR dup_rec IN 
    SELECT wedding_name_id, COUNT(*) as cnt
    FROM weddings
    WHERE wedding_name_id IS NOT NULL
    GROUP BY wedding_name_id
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    FOR row_rec IN 
      SELECT id FROM weddings 
      WHERE wedding_name_id = dup_rec.wedding_name_id
      ORDER BY created_at
      OFFSET 1
    LOOP
      UPDATE weddings 
      SET wedding_name_id = dup_rec.wedding_name_id || '-' || counter
      WHERE id = row_rec.id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'weddings_wedding_name_id_key'
  ) THEN
    ALTER TABLE "weddings" ADD CONSTRAINT "weddings_wedding_name_id_key" UNIQUE ("wedding_name_id");
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS "idx_weddings_wedding_name_id" ON weddings("wedding_name_id");
