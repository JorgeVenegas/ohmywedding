-- Row Level Security (RLS) policies

-- Enable RLS on all tables
alter table "weddings" enable row level security;
alter table "wedding_schedule" enable row level security;
alter table "guest_groups" enable row level security;
alter table "guests" enable row level security;
alter table "rsvps" enable row level security;
alter table "gallery_albums" enable row level security;
alter table "gallery_photos" enable row level security;
alter table "wedding_faqs" enable row level security;
alter table "wedding_pages" enable row level security;
alter table "gift_registries" enable row level security;
alter table "gift_items" enable row level security;
alter table "custom_registry_items" enable row level security;
alter table "registry_contributions" enable row level security;

-- Policies for weddings table

-- Public read policy (guests should be able to view all wedding content)
create policy "Anyone can view wedding content" on weddings
  for select using (true);

-- Create policy - anyone can create weddings
create policy "Anyone can create weddings" on weddings
  for insert with check (true);

-- Update policies - owners and collaborators can update their weddings
create policy "Owners and collaborators can update weddings" on weddings
  for update using (
    owner_id = auth.uid() -- Owner can edit
    or owner_id is null -- Anyone logged in can claim/edit unowned weddings  
    or auth.jwt() ->> 'email' = any(collaborator_emails) -- Collaborators can edit
  );

-- Delete policy - only owners can delete their weddings
create policy "Wedding owners can delete their weddings" on weddings
  for delete using (auth.uid() = owner_id);

create policy "Anyone can view wedding schedule" on wedding_schedule
  for select using (true);

create policy "Anyone can view gallery albums" on gallery_albums
  for select using (is_public = true);

create policy "Anyone can view gallery photos" on gallery_photos
  for select using (true);

create policy "Anyone can view wedding FAQs" on wedding_faqs
  for select using (is_visible = true);

create policy "Anyone can view wedding pages" on wedding_pages
  for select using (is_enabled = true);

create policy "Anyone can view gift registries" on gift_registries
  for select using (true);

create policy "Anyone can view gift items" on gift_items
  for select using (true);

-- RSVP policies (guests can submit RSVPs, but only owners can read them)
create policy "Anyone can submit RSVPs" on rsvps
  for insert with check (true);

create policy "Owners and collaborators can view RSVPs" on rsvps
  for select using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- Guest groups policies
-- Allow public read access for RSVP pages
create policy "Anyone can view guest groups" on guest_groups
  for select using (true);

create policy "Wedding owners and collaborators can manage guest groups" on guest_groups
  for all 
  using (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  )
  with check (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- Guests policies
-- Allow public read access for RSVP pages
create policy "Anyone can view guests" on guests
  for select using (true);

create policy "Wedding owners and collaborators can manage guests" on guests
  for all 
  using (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  )
  with check (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- Owner management policies (includes collaborators)
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

-- Storage policies for wedding-images bucket
-- Note: RLS is already enabled on storage.objects by default

-- Policy: Allow anyone to view wedding images (public read)
create policy "Anyone can view wedding images" on storage.objects
  for select using (bucket_id = 'wedding-images');

-- Policy: Allow anonymous users to upload wedding images
create policy "Allow public uploads to wedding images" on storage.objects
  for insert with check (bucket_id = 'wedding-images');

-- Policy: Allow users to update their own uploaded images  
create policy "Users can update wedding images" on storage.objects
  for update using (bucket_id = 'wedding-images');

-- Policy: Allow users to delete wedding images
create policy "Users can delete wedding images" on storage.objects
  for delete using (bucket_id = 'wedding-images');

-- Custom registry items policies - public can view active items
create policy "Anyone can view active custom registry items" on custom_registry_items
  for select using (is_active = true);

create policy "Wedding owners and collaborators can manage custom registry items" on custom_registry_items
  for all using (
    wedding_id in (
      select id from weddings 
      where owner_id = auth.uid() 
        or owner_id is null
        or auth.email() = any(collaborator_emails)
    )
  );

-- Registry contributions policies - guests can create, owners can view
create policy "Anyone can create registry contributions" on registry_contributions
  for insert with check (true);

create policy "Anyone can read registry contributions by checkout session" on registry_contributions
  for select using (stripe_checkout_session_id is not null);

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