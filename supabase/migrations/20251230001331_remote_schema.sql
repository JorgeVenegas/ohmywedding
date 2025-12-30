drop extension if exists "pg_net";

alter table "public"."weddings" drop constraint "weddings_wedding_name_id_key";

drop function if exists "public"."update_registry_item_amount"(p_item_id uuid, p_amount_to_add numeric);

drop index if exists "public"."idx_weddings_compound_key";

drop index if exists "public"."idx_weddings_wedding_name_id";

drop index if exists "public"."weddings_wedding_name_id_key";

alter table "public"."weddings" drop column "wedding_name_id";

CREATE INDEX idx_gallery_albums_wedding_id ON public.gallery_albums USING btree (wedding_id);

CREATE INDEX idx_gallery_photos_wedding_id ON public.gallery_photos USING btree (wedding_id);

CREATE INDEX idx_gift_items_wedding_id ON public.gift_items USING btree (wedding_id);

CREATE INDEX idx_gift_registries_wedding_id ON public.gift_registries USING btree (wedding_id);

CREATE INDEX idx_guest_groups_wedding_id ON public.guest_groups USING btree (wedding_id);

CREATE INDEX idx_guests_wedding_id ON public.guests USING btree (wedding_id);

CREATE INDEX idx_rsvps_wedding_id ON public.rsvps USING btree (wedding_id);

CREATE INDEX idx_wedding_faqs_wedding_id ON public.wedding_faqs USING btree (wedding_id);

CREATE INDEX idx_wedding_pages_wedding_id ON public.wedding_pages USING btree (wedding_id);

CREATE INDEX idx_wedding_schedule_wedding_id ON public.wedding_schedule USING btree (wedding_id);


