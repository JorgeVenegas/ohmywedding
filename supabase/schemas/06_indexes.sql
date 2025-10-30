-- Create indexes for better performance
create index "idx_weddings_date_id" on weddings("date_id");
create index "idx_weddings_wedding_name_id" on weddings("wedding_name_id");
create index "idx_weddings_compound_key" on weddings("date_id", "wedding_name_id");
create index "idx_weddings_owner_id" on weddings("owner_id");
create index "idx_weddings_wedding_date" on weddings("wedding_date");

create index "idx_guests_compound_key" on guests("date_id", "wedding_name_id");
create index "idx_guests_email" on guests("email");

create index "idx_rsvps_compound_key" on rsvps("date_id", "wedding_name_id");
create index "idx_rsvps_email" on rsvps("guest_email");

create index "idx_gallery_albums_compound_key" on gallery_albums("date_id", "wedding_name_id");
create index "idx_gallery_photos_album_id" on gallery_photos("album_id");
create index "idx_gallery_photos_compound_key" on gallery_photos("date_id", "wedding_name_id");

create index "idx_wedding_faqs_compound_key" on wedding_faqs("date_id", "wedding_name_id");
create index "idx_wedding_pages_compound_key" on wedding_pages("date_id", "wedding_name_id");

create index "idx_gift_registries_compound_key" on gift_registries("date_id", "wedding_name_id");
create index "idx_gift_items_registry_id" on gift_items("registry_id");
create index "idx_gift_items_compound_key" on gift_items("date_id", "wedding_name_id");

create index "idx_wedding_schedule_compound_key" on wedding_schedule("date_id", "wedding_name_id");