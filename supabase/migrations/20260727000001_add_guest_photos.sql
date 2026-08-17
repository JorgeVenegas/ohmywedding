create table guest_photos (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid not null references weddings(id) on delete cascade,
  s3_key          text not null,
  url             text not null,
  uploader_name   text,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  file_name       text,
  file_size       bigint,
  mime_type       text,
  created_at      timestamptz not null default now()
);

create index guest_photos_wedding_id_idx on guest_photos(wedding_id);
create index guest_photos_status_idx on guest_photos(wedding_id, status);
