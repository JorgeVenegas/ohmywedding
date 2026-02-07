-- Add plan column to wedding_features table

ALTER TABLE public.wedding_features 
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- Add constraint
ALTER TABLE public.wedding_features
ADD CONSTRAINT wedding_features_plan_check CHECK (plan IN ('free', 'premium', 'deluxe'));

-- Update existing records to match their features
UPDATE public.wedding_features
SET plan = CASE
  WHEN rsvp_enabled = true OR invitations_panel_enabled = true THEN 'premium'
  ELSE 'free'
END
WHERE plan = 'free';
