-- Row Level Security (RLS) policies

-- Enable RLS on all tables
alter table "weddings" enable row level security;
alter table "wedding_schedule" enable row level security;
alter table "guests" enable row level security;
alter table "rsvps" enable row level security;
alter table "gallery_albums" enable row level security;
alter table "gallery_photos" enable row level security;
alter table "wedding_faqs" enable row level security;
alter table "wedding_pages" enable row level security;
alter table "gift_registries" enable row level security;
alter table "gift_items" enable row level security;

-- Policies for weddings table

-- Public read policy (guests should be able to view all wedding content)
create policy "Anyone can view wedding content" on weddings
  for select using (true);

-- Create policy - anyone can create weddings
create policy "Anyone can create weddings" on weddings
  for insert with check (true);

-- Update policies - owners can update their weddings, anyone can update unowned weddings
create policy "Anyone can update weddings" on weddings
  for update using (true);

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

-- RSVP policies (guests can submit RSVPs)
create policy "Anyone can submit RSVPs" on rsvps
  for insert with check (true);

create policy "Anyone can view RSVPs" on rsvps
  for select using (true);

-- Owner management policies
create policy "Wedding owners can manage schedule" on wedding_schedule
  for all using (
    (date_id, wedding_name_id) in (
      select date_id, wedding_name_id from weddings where owner_id = auth.uid()
    )
  );

create policy "Wedding owners can manage FAQs" on wedding_faqs
  for all using (
    (date_id, wedding_name_id) in (
      select date_id, wedding_name_id from weddings where owner_id = auth.uid()
    )
  );

create policy "Wedding owners can manage pages" on wedding_pages
  for all using (
    (date_id, wedding_name_id) in (
      select date_id, wedding_name_id from weddings where owner_id = auth.uid()  
    )
  );

create policy "Wedding owners can manage gallery" on gallery_albums
  for all using (
    (date_id, wedding_name_id) in (
      select date_id, wedding_name_id from weddings where owner_id = auth.uid()
    )
  );

create policy "Wedding owners can manage photos" on gallery_photos
  for all using (
    (date_id, wedding_name_id) in (
      select date_id, wedding_name_id from weddings where owner_id = auth.uid()
    )
  );

create policy "Wedding owners can manage registries" on gift_registries
  for all using (
    (date_id, wedding_name_id) in (
      select date_id, wedding_name_id from weddings where owner_id = auth.uid()
    )
  );

create policy "Wedding owners can manage gift items" on gift_items
  for all using (
    (date_id, wedding_name_id) in (
      select date_id, wedding_name_id from weddings where owner_id = auth.uid()
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