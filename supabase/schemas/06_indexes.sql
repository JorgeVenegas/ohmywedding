-- Create indexes for better performance
create index "idx_weddings_date_id" on weddings("date_id");
create index "idx_weddings_wedding_name_id" on weddings("wedding_name_id");
create index "idx_weddings_owner_id" on weddings("owner_id");
create index "idx_weddings_wedding_date" on weddings("wedding_date");

create index "idx_guest_groups_wedding_id" on guest_groups("wedding_id");
create index "idx_guest_groups_draft" on guest_groups (wedding_id, is_draft) where is_draft = true;

create index "idx_guests_wedding_id" on guests("wedding_id");
create index "idx_guests_guest_group_id" on guests("guest_group_id");
create index "idx_guests_email" on guests("email");
create index "idx_guests_confirmation_status" on guests("confirmation_status");

create index "idx_rsvps_wedding_id" on rsvps("wedding_id");
create index "idx_rsvps_email" on rsvps("guest_email");

create index "idx_gallery_albums_wedding_id" on gallery_albums("wedding_id");
create index "idx_gallery_photos_album_id" on gallery_photos("album_id");
create index "idx_gallery_photos_wedding_id" on gallery_photos("wedding_id");

create index "idx_wedding_faqs_wedding_id" on wedding_faqs("wedding_id");
create index "idx_wedding_pages_wedding_id" on wedding_pages("wedding_id");

create index "idx_gift_registries_wedding_id" on gift_registries("wedding_id");
create index "idx_gift_items_registry_id" on gift_items("registry_id");
create index "idx_gift_items_wedding_id" on gift_items("wedding_id");

create index "idx_wedding_schedule_wedding_id" on wedding_schedule("wedding_id");