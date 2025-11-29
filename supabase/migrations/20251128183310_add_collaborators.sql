-- Add collaborator_emails column to weddings table
alter table "weddings" add column if not exists "collaborator_emails" text[] default '{}';

-- Drop existing update policy for weddings if exists and recreate
drop policy if exists "Anyone can update weddings" on weddings;
drop policy if exists "Owners and collaborators can update weddings" on weddings;

-- Update policies - owners and collaborators can update their weddings, anyone can update unowned weddings
create policy "Owners and collaborators can update weddings" on weddings
  for update using (
    owner_id is null -- Allow editing unowned weddings
    or owner_id = auth.uid() -- Owner can edit
    or (select email from auth.users where id = auth.uid()) = any(collaborator_emails) -- Collaborators can edit
  );

-- Update management policies to include collaborators
-- Note: We need to drop and recreate these policies

-- wedding_schedule
drop policy if exists "Wedding owners can manage schedule" on wedding_schedule;
drop policy if exists "Wedding owners and collaborators can manage schedule" on wedding_schedule;
create policy "Wedding owners and collaborators can manage schedule" on wedding_schedule
  for all using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or (select email from auth.users where id = auth.uid()) = any(collaborator_emails)
    )
  );

-- wedding_faqs
drop policy if exists "Wedding owners can manage FAQs" on wedding_faqs;
drop policy if exists "Wedding owners and collaborators can manage FAQs" on wedding_faqs;
create policy "Wedding owners and collaborators can manage FAQs" on wedding_faqs
  for all using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or (select email from auth.users where id = auth.uid()) = any(collaborator_emails)
    )
  );

-- wedding_pages
drop policy if exists "Wedding owners can manage pages" on wedding_pages;
drop policy if exists "Wedding owners and collaborators can manage pages" on wedding_pages;
create policy "Wedding owners and collaborators can manage pages" on wedding_pages
  for all using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or (select email from auth.users where id = auth.uid()) = any(collaborator_emails)
    )
  );

-- gallery_albums
drop policy if exists "Wedding owners can manage gallery" on gallery_albums;
drop policy if exists "Wedding owners and collaborators can manage gallery" on gallery_albums;
create policy "Wedding owners and collaborators can manage gallery" on gallery_albums
  for all using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or (select email from auth.users where id = auth.uid()) = any(collaborator_emails)
    )
  );

-- gallery_photos
drop policy if exists "Wedding owners can manage photos" on gallery_photos;
drop policy if exists "Wedding owners and collaborators can manage photos" on gallery_photos;
create policy "Wedding owners and collaborators can manage photos" on gallery_photos
  for all using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or (select email from auth.users where id = auth.uid()) = any(collaborator_emails)
    )
  );

-- gift_registries
drop policy if exists "Wedding owners can manage registries" on gift_registries;
drop policy if exists "Wedding owners and collaborators can manage registries" on gift_registries;
create policy "Wedding owners and collaborators can manage registries" on gift_registries
  for all using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or (select email from auth.users where id = auth.uid()) = any(collaborator_emails)
    )
  );

-- gift_items
drop policy if exists "Wedding owners can manage gift items" on gift_items;
drop policy if exists "Wedding owners and collaborators can manage gift items" on gift_items;
create policy "Wedding owners and collaborators can manage gift items" on gift_items
  for all using (
    wedding_name_id in (
      select wedding_name_id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or (select email from auth.users where id = auth.uid()) = any(collaborator_emails)
    )
  );
