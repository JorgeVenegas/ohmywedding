-- Add dashboard_sections JSONB column to wedding_settings
-- Allows wedding owner to enable/disable dashboard sections for all users
ALTER TABLE public.wedding_settings
ADD COLUMN IF NOT EXISTS dashboard_sections JSONB DEFAULT '{}'::jsonb;
