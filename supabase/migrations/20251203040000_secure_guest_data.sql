-- SECURITY FIX: Make guest data private - only visible to wedding owners and collaborators
-- This is critical for protecting personal guest information

-- =====================================================
-- GUEST GROUPS: Remove public read, make it private
-- =====================================================
drop policy if exists "Anyone can view guest groups" on "public"."guest_groups";

create policy "Owners and collaborators can view guest groups"
  on "public"."guest_groups"
  as permissive
  for select
  to public
  using (
    wedding_name_id in (
      select wedding_name_id from public.weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- =====================================================
-- GUESTS: Remove public read, make it private
-- =====================================================
drop policy if exists "Anyone can view guests" on "public"."guests";

create policy "Owners and collaborators can view guests"
  on "public"."guests"
  as permissive
  for select
  to public
  using (
    wedding_name_id in (
      select wedding_name_id from public.weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- =====================================================
-- RSVPS: Remove public read, make it private
-- Only owners/collaborators should see RSVP submissions
-- =====================================================
drop policy if exists "Anyone can view RSVPs" on "public"."rsvps";

create policy "Owners and collaborators can view RSVPs"
  on "public"."rsvps"
  as permissive
  for select
  to public
  using (
    wedding_name_id in (
      select wedding_name_id from public.weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- Keep the insert policy for RSVPs - guests need to submit RSVPs
-- "Anyone can submit RSVPs" policy remains intact
