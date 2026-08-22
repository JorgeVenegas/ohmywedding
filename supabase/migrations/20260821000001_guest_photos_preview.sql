-- Add preview columns to guest_photos.
-- preview_key:      S3 key of the Sharp-generated WebP preview (null = not yet generated)
-- preview_size:     byte size of the preview file
-- preview_attempts: how many times preview generation has been attempted (capped at 2 in app logic)

alter table guest_photos
  add column if not exists preview_key      text,
  add column if not exists preview_size     bigint,
  add column if not exists preview_attempts int not null default 0;

-- Index speeds up the GET fallback query that finds photos without previews
create index if not exists guest_photos_no_preview_idx
  on guest_photos (wedding_id, preview_attempts)
  where preview_key is null;
