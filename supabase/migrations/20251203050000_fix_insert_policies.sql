-- Fix RLS policies for INSERT operations
-- The "for all" policies need WITH CHECK clause for INSERT to work

-- =====================================================
-- GUEST GROUPS: Fix INSERT policy
-- =====================================================
drop policy if exists "Wedding owners and collaborators can manage guest groups" on "public"."guest_groups";

create policy "Wedding owners and collaborators can manage guest groups" on guest_groups
  for all 
  using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  )
  with check (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- =====================================================
-- GUESTS: Fix INSERT policy
-- =====================================================
drop policy if exists "Wedding owners and collaborators can manage guests" on "public"."guests";

create policy "Wedding owners and collaborators can manage guests" on guests
  for all 
  using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  )
  with check (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- =====================================================
-- RSVPs: Add management policy for owners (update/delete)
-- =====================================================
create policy "Wedding owners and collaborators can manage RSVPs" on rsvps
  for all 
  using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  )
  with check (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );
