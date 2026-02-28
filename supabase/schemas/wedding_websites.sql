-- Wedding Websites Table
-- Separates website configuration from core wedding data
-- A wedding can exist without a website (has_website=false on weddings table)
-- If a row exists here, the wedding has a website
CREATE TABLE IF NOT EXISTS public.wedding_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  
  -- The full page configuration (components, sections, theme, etc.)
  page_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Flag for weddings migrated from the legacy weddings.page_config column
  is_legacy BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT wedding_websites_wedding_id_unique UNIQUE (wedding_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wedding_websites_wedding_id ON public.wedding_websites(wedding_id);

-- Enable RLS
ALTER TABLE public.wedding_websites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read website config (needed for public wedding pages)
CREATE POLICY "Anyone can view wedding websites"
  ON public.wedding_websites
  FOR SELECT
  TO public
  USING (true);

-- Wedding owners can insert their website
CREATE POLICY "Wedding owners can insert their website"
  ON public.wedding_websites
  FOR INSERT
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Wedding owners can update their website
CREATE POLICY "Wedding owners can update their website"
  ON public.wedding_websites
  FOR UPDATE
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Collaborators can insert website (editors)
CREATE POLICY "Collaborators can insert website"
  ON public.wedding_websites
  FOR INSERT
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE collaborator_emails @> ARRAY[auth.jwt()->>'email']
    )
  );

-- Collaborators can update website (editors)
CREATE POLICY "Collaborators can update website"
  ON public.wedding_websites
  FOR UPDATE
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE collaborator_emails @> ARRAY[auth.jwt()->>'email']
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_wedding_websites_updated_at
  BEFORE UPDATE ON public.wedding_websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.wedding_websites TO anon;
GRANT SELECT, INSERT, UPDATE ON public.wedding_websites TO authenticated;
