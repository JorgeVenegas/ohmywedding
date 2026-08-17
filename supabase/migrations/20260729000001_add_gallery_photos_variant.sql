alter table wedding_settings
  add column if not exists gallery_photos_variant text not null default 'classic';
