-- Collaborator Permissions Table
-- Defines granular permissions for wedding collaborators
-- Default is read-only access to everything

CREATE TABLE IF NOT EXISTS public.collaborator_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  collaborator_email TEXT NOT NULL,
  
  -- Permission flags (default to read-only)
  can_edit_details BOOLEAN DEFAULT false, -- Can edit basic wedding details
  can_edit_page_design BOOLEAN DEFAULT false, -- Can edit page design/config
  can_manage_guests BOOLEAN DEFAULT false, -- Can add/edit/delete guests
  can_view_guests BOOLEAN DEFAULT true, -- Can view guest list
  can_manage_invitations BOOLEAN DEFAULT false, -- Can send/manage invitations
  can_view_invitations BOOLEAN DEFAULT true, -- Can view invitation status
  can_manage_registry BOOLEAN DEFAULT false, -- Can edit registry items
  can_view_registry BOOLEAN DEFAULT true, -- Can view registry contributions
  can_manage_gallery BOOLEAN DEFAULT false, -- Can add/edit gallery photos
  can_view_gallery BOOLEAN DEFAULT true, -- Can view gallery
  can_manage_rsvps BOOLEAN DEFAULT false, -- Can edit RSVP responses
  can_view_rsvps BOOLEAN DEFAULT true, -- Can view RSVP data
  can_manage_collaborators BOOLEAN DEFAULT false, -- Can add/remove other collaborators
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one permission record per collaborator per wedding
  UNIQUE(wedding_id, collaborator_email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_collaborator_permissions_wedding_id 
  ON public.collaborator_permissions(wedding_id);

CREATE INDEX IF NOT EXISTS idx_collaborator_permissions_email 
  ON public.collaborator_permissions(collaborator_email);

-- Enable RLS
ALTER TABLE public.collaborator_permissions ENABLE ROW LEVEL SECURITY;

-- Wedding owners and collaborators can view permissions
CREATE POLICY "Wedding owners and collaborators can view permissions"
  ON public.collaborator_permissions
  FOR SELECT
  TO public
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
        OR (auth.jwt()->>'email') = ANY(collaborator_emails)
    )
  );

-- Only wedding owners can manage permissions
CREATE POLICY "Wedding owners can manage permissions"
  ON public.collaborator_permissions
  FOR ALL
  TO authenticated
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_collaborator_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collaborator_permissions_updated_at
  BEFORE UPDATE ON public.collaborator_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborator_permissions_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborator_permissions TO authenticated;

-- Helper function to get collaborator permissions
CREATE OR REPLACE FUNCTION get_collaborator_permissions(
  p_wedding_id UUID,
  p_email TEXT
)
RETURNS TABLE (
  can_edit_details BOOLEAN,
  can_edit_page_design BOOLEAN,
  can_manage_guests BOOLEAN,
  can_view_guests BOOLEAN,
  can_manage_invitations BOOLEAN,
  can_view_invitations BOOLEAN,
  can_manage_registry BOOLEAN,
  can_view_registry BOOLEAN,
  can_manage_gallery BOOLEAN,
  can_view_gallery BOOLEAN,
  can_manage_rsvps BOOLEAN,
  can_view_rsvps BOOLEAN,
  can_manage_collaborators BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.can_edit_details,
    cp.can_edit_page_design,
    cp.can_manage_guests,
    cp.can_view_guests,
    cp.can_manage_invitations,
    cp.can_view_invitations,
    cp.can_manage_registry,
    cp.can_view_registry,
    cp.can_manage_gallery,
    cp.can_view_gallery,
    cp.can_manage_rsvps,
    cp.can_view_rsvps,
    cp.can_manage_collaborators
  FROM public.collaborator_permissions cp
  WHERE cp.wedding_id = p_wedding_id
    AND LOWER(cp.collaborator_email) = LOWER(p_email);
END;
$$;
