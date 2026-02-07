-- Add plan column to wedding_features table

ALTER TABLE public.wedding_features 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Add constraint if it doesn't exist using information_schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'wedding_features' 
    AND constraint_name = 'wedding_features_plan_check'
    AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE public.wedding_features
    ADD CONSTRAINT wedding_features_plan_check CHECK (plan IN ('free', 'premium', 'deluxe'));
  END IF;
END $$;

-- Update existing records to match their features (idempotent - only updates 'free' records)
UPDATE public.wedding_features
SET plan = CASE
  WHEN rsvp_enabled = true OR invitations_panel_enabled = true THEN 'premium'
  ELSE 'free'
END
WHERE plan = 'free';
