-- Allow anonymous uploads to wedding-images bucket
DROP POLICY IF EXISTS "Authenticated users can upload wedding images" ON storage.objects;

CREATE POLICY "Anyone can upload wedding images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'wedding-images');