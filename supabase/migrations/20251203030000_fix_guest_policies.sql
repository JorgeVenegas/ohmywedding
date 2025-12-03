-- Fix guest groups and guests policies to use auth.email() instead of querying auth.users directly

-- Drop existing policies
drop policy if exists "Wedding owners and collaborators can manage guest groups" on "public"."guest_groups";
drop policy if exists "Wedding owners and collaborators can manage guests" on "public"."guests";

-- Recreate policies using auth.email() function which is the proper way to get current user's email
create policy "Wedding owners and collaborators can manage guest groups"
  on "public"."guest_groups"
  as permissive
  for all
  to public
  using (
    wedding_name_id in (
      select wedding_name_id from public.weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage guests"
  on "public"."guests"
  as permissive
  for all
  to public
  using (
    wedding_name_id in (
      select wedding_name_id from public.weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );
