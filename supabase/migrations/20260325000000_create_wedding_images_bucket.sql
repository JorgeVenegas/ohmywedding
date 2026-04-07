-- Create the wedding-images storage bucket if it doesn't exist
-- This bucket was previously created manually or via scripts but never via migration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wedding-images',
  'wedding-images',
  true,
  52428800,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;
