-- Update RLS policies to use wedding_id instead of wedding_name_id

-- Drop existing policies that use wedding_name_id
drop policy if exists "Owners and collaborators can view RSVPs" on rsvps;
drop policy if exists "Owners and collaborators can view guest groups" on guest_groups;
drop policy if exists "Wedding owners and collaborators can manage guest groups" on guest_groups;
drop policy if exists "Owners and collaborators can view guests" on guests;
drop policy if exists "Wedding owners and collaborators can manage guests" on guests;
drop policy if exists "Wedding owners and collaborators can manage schedule" on wedding_schedule;
drop policy if exists "Wedding owners and collaborators can manage FAQs" on wedding_faqs;
drop policy if exists "Wedding owners and collaborators can manage pages" on wedding_pages;
drop policy if exists "Wedding owners and collaborators can manage gallery" on gallery_albums;
drop policy if exists "Wedding owners and collaborators can manage photos" on gallery_photos;
drop policy if exists "Wedding owners and collaborators can manage registries" on gift_registries;
drop policy if exists "Wedding owners and collaborators can manage gift items" on gift_items;
drop policy if exists "Wedding owners and collaborators can manage custom registry items" on custom_registry_items;
drop policy if exists "Owners and collaborators can view registry contributions" on registry_contributions;
drop policy if exists "Wedding owners and collaborators can update registry contributions" on registry_contributions;

-- Recreate policies using wedding_id
create policy "Owners and collaborators can view RSVPs" on rsvps
  for select using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Owners and collaborators can view guest groups" on guest_groups
  for select using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage guest groups" on guest_groups
  for all 
  using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  )
  with check (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Owners and collaborators can view guests" on guests
  for select using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage guests" on guests
  for all 
  using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  )
  with check (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage schedule" on wedding_schedule
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage FAQs" on wedding_faqs
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage pages" on wedding_pages
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage gallery" on gallery_albums
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage photos" on gallery_photos
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage registries" on gift_registries
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage gift items" on gift_items
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can manage custom registry items" on custom_registry_items
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Owners and collaborators can view registry contributions" on registry_contributions
  for select using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

create policy "Wedding owners and collaborators can update registry contributions" on registry_contributions
  for update using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );
