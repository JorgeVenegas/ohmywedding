-- Storage policies for wedding-images bucket
-- Note: RLS is already enabled on storage.objects by default

-- Policy: Allow anyone to view wedding images (public read)
DROP POLICY IF EXISTS "Anyone can view wedding images" ON storage.objects;
CREATE POLICY "Anyone can view wedding images" ON storage.objects
  FOR SELECT USING (bucket_id = 'wedding-images');

-- Policy: Allow anonymous users to upload wedding images
DROP POLICY IF EXISTS "Allow public uploads to wedding images" ON storage.objects;
CREATE POLICY "Allow public uploads to wedding images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'wedding-images');

-- Policy: Allow users to update their own uploaded images  
DROP POLICY IF EXISTS "Users can update wedding images" ON storage.objects;
CREATE POLICY "Users can update wedding images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'wedding-images');

-- Policy: Allow users to delete wedding images
DROP POLICY IF EXISTS "Users can delete wedding images" ON storage.objects;
CREATE POLICY "Users can delete wedding images" ON storage.objects
  FOR DELETE USING (bucket_id = 'wedding-images');
