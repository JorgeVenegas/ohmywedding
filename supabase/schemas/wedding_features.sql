-- Wedding Subscriptions Table
-- This table tracks which plan each wedding has and when it was activated
-- Features and limits are defined by the plan in the plan_features table
CREATE TABLE IF NOT EXISTS public.wedding_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  
  -- Plan information
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'deluxe')),
  
  -- Subscription metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT wedding_subscriptions_wedding_id_unique UNIQUE (wedding_id)
);

-- Wedding Settings Table
-- This table stores user preferences and configuration for each wedding
CREATE TABLE IF NOT EXISTS public.wedding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  
  -- RSVP Settings
  rsvp_travel_confirmation_enabled BOOLEAN NOT NULL DEFAULT true,
  rsvp_require_ticket_attachment BOOLEAN NOT NULL DEFAULT false,
  rsvp_require_no_ticket_reason BOOLEAN NOT NULL DEFAULT false,
  rsvp_allow_plus_ones BOOLEAN NOT NULL DEFAULT true,
  rsvp_deadline DATE,
  
  -- Invitation Settings
  invitation_default_message TEXT,
  invitation_custom_fields JSONB DEFAULT '[]'::jsonb,
  
  -- Gallery Settings
  gallery_allow_guest_uploads BOOLEAN NOT NULL DEFAULT false,
  gallery_moderation_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- General Settings
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT wedding_settings_wedding_id_unique UNIQUE (wedding_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wedding_subscriptions_wedding_id ON public.wedding_subscriptions(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_subscriptions_plan ON public.wedding_subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_wedding_settings_wedding_id ON public.wedding_settings(wedding_id);

-- Enable Row Level Security
ALTER TABLE public.wedding_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wedding_subscriptions
-- Anyone can read wedding subscription plan (needed for public pages like registry)
CREATE POLICY "Anyone can view wedding subscription plan"
  ON public.wedding_subscriptions
  FOR SELECT
  TO public
  USING (true);

-- Wedding owners and collaborators can view their subscription
CREATE POLICY "Wedding owners and collaborators can view subscriptions"
  ON public.wedding_subscriptions
  FOR SELECT
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
        OR collaborator_emails @> ARRAY[auth.jwt()->>'email']
    )
  );

-- Only the wedding owner can update their subscription (typically admin only)
CREATE POLICY "Wedding owners can update their subscriptions"
  ON public.wedding_subscriptions
  FOR UPDATE
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Only the wedding owner can insert subscriptions
CREATE POLICY "Wedding owners can insert their subscriptions"
  ON public.wedding_subscriptions
  FOR INSERT
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for wedding_settings
-- Only the wedding owner can view their settings
CREATE POLICY "Wedding owners can view their settings"
  ON public.wedding_settings
  FOR SELECT
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Only the wedding owner can update their settings
CREATE POLICY "Wedding owners can update their settings"
  ON public.wedding_settings
  FOR UPDATE
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Only the wedding owner can insert settings
CREATE POLICY "Wedding owners can insert their settings"
  ON public.wedding_settings
  FOR INSERT
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_wedding_subscriptions_updated_at
  BEFORE UPDATE ON public.wedding_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wedding_settings_updated_at
  BEFORE UPDATE ON public.wedding_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.wedding_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.wedding_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.wedding_settings TO authenticated;
