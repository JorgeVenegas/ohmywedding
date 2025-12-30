-- Restore public read policies for guests and guest_groups
-- These are needed for public RSVP pages to work for non-logged-in users

create policy "Anyone can view guests"
  on "public"."guests"
  as permissive
  for select
  to public
  using (true);

create policy "Anyone can view guest groups"
  on "public"."guest_groups"
  as permissive
  for select
  to public
  using (true);
