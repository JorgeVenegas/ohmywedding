-- Add default_guest_view column to wedding_settings
-- Allows wedding owner to set a default view mode for the guests/invitations page
ALTER TABLE public.wedding_settings
ADD COLUMN IF NOT EXISTS default_guest_view TEXT DEFAULT 'groups' CHECK (default_guest_view IN ('flat', 'groups'));
