drop policy "Wedding owners can manage gallery" on "public"."gallery_albums";

drop policy "Wedding owners can manage photos" on "public"."gallery_photos";

drop policy "Wedding owners can manage gift items" on "public"."gift_items";

drop policy "Wedding owners can manage registries" on "public"."gift_registries";

drop policy "Wedding owners can manage FAQs" on "public"."wedding_faqs";

drop policy "Wedding owners can manage pages" on "public"."wedding_pages";

drop policy "Wedding owners can manage schedule" on "public"."wedding_schedule";

alter table "public"."gallery_albums" drop constraint "gallery_albums_wedding_id_fkey";

alter table "public"."gallery_photos" drop constraint "gallery_photos_wedding_id_fkey";

alter table "public"."gift_items" drop constraint "gift_items_wedding_id_fkey";

alter table "public"."gift_registries" drop constraint "gift_registries_wedding_id_fkey";

alter table "public"."guests" drop constraint "guests_wedding_id_fkey";

alter table "public"."rsvps" drop constraint "rsvps_wedding_id_fkey";

alter table "public"."wedding_faqs" drop constraint "wedding_faqs_wedding_id_fkey";

alter table "public"."wedding_pages" drop constraint "wedding_pages_wedding_id_fkey";

alter table "public"."wedding_schedule" drop constraint "wedding_schedule_wedding_id_fkey";

alter table "public"."weddings" drop constraint "weddings_wedding_id_key";

drop index if exists "public"."idx_gallery_albums_wedding_id";

drop index if exists "public"."idx_gallery_photos_wedding_id";

drop index if exists "public"."idx_gift_items_wedding_id";

drop index if exists "public"."idx_gift_registries_wedding_id";

drop index if exists "public"."idx_guests_wedding_id";

drop index if exists "public"."idx_rsvps_wedding_id";

drop index if exists "public"."idx_wedding_faqs_wedding_id";

drop index if exists "public"."idx_wedding_pages_wedding_id";

drop index if exists "public"."idx_wedding_schedule_wedding_id";

drop index if exists "public"."idx_weddings_wedding_id";

drop index if exists "public"."weddings_wedding_id_key";

alter table "public"."gallery_albums" drop column "wedding_id";

alter table "public"."gallery_albums" add column "date_id" text not null;

alter table "public"."gallery_albums" add column "wedding_name_id" text not null;

alter table "public"."gallery_photos" drop column "wedding_id";

alter table "public"."gallery_photos" add column "date_id" text not null;

alter table "public"."gallery_photos" add column "wedding_name_id" text not null;

alter table "public"."gift_items" drop column "wedding_id";

alter table "public"."gift_items" add column "date_id" text not null;

alter table "public"."gift_items" add column "wedding_name_id" text not null;

alter table "public"."gift_registries" drop column "wedding_id";

alter table "public"."gift_registries" add column "date_id" text not null;

alter table "public"."gift_registries" add column "wedding_name_id" text not null;

alter table "public"."guests" drop column "wedding_id";

alter table "public"."guests" add column "date_id" text not null;

alter table "public"."guests" add column "wedding_name_id" text not null;

alter table "public"."rsvps" drop column "wedding_id";

alter table "public"."rsvps" add column "date_id" text not null;

alter table "public"."rsvps" add column "wedding_name_id" text not null;

alter table "public"."wedding_faqs" drop column "wedding_id";

alter table "public"."wedding_faqs" add column "date_id" text not null;

alter table "public"."wedding_faqs" add column "wedding_name_id" text not null;

alter table "public"."wedding_pages" drop column "wedding_id";

alter table "public"."wedding_pages" add column "date_id" text not null;

alter table "public"."wedding_pages" add column "wedding_name_id" text not null;

alter table "public"."wedding_schedule" drop column "wedding_id";

alter table "public"."wedding_schedule" add column "date_id" text not null;

alter table "public"."wedding_schedule" add column "wedding_name_id" text not null;

alter table "public"."weddings" drop column "wedding_id";

alter table "public"."weddings" add column "date_id" text not null;

alter table "public"."weddings" add column "wedding_name_id" text not null;

CREATE INDEX idx_gallery_albums_compound_key ON public.gallery_albums USING btree (date_id, wedding_name_id);

CREATE INDEX idx_gallery_photos_compound_key ON public.gallery_photos USING btree (date_id, wedding_name_id);

CREATE INDEX idx_gift_items_compound_key ON public.gift_items USING btree (date_id, wedding_name_id);

CREATE INDEX idx_gift_registries_compound_key ON public.gift_registries USING btree (date_id, wedding_name_id);

CREATE INDEX idx_guests_compound_key ON public.guests USING btree (date_id, wedding_name_id);

CREATE INDEX idx_rsvps_compound_key ON public.rsvps USING btree (date_id, wedding_name_id);

CREATE INDEX idx_wedding_faqs_compound_key ON public.wedding_faqs USING btree (date_id, wedding_name_id);

CREATE INDEX idx_wedding_pages_compound_key ON public.wedding_pages USING btree (date_id, wedding_name_id);

CREATE INDEX idx_wedding_schedule_compound_key ON public.wedding_schedule USING btree (date_id, wedding_name_id);

CREATE INDEX idx_weddings_compound_key ON public.weddings USING btree (date_id, wedding_name_id);

CREATE INDEX idx_weddings_date_id ON public.weddings USING btree (date_id);

CREATE INDEX idx_weddings_wedding_name_id ON public.weddings USING btree (wedding_name_id);

CREATE UNIQUE INDEX weddings_date_id_wedding_name_id_key ON public.weddings USING btree (date_id, wedding_name_id);

alter table "public"."gallery_albums" add constraint "gallery_albums_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gallery_albums" validate constraint "gallery_albums_date_id_wedding_name_id_fkey";

alter table "public"."gallery_photos" add constraint "gallery_photos_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gallery_photos" validate constraint "gallery_photos_date_id_wedding_name_id_fkey";

alter table "public"."gift_items" add constraint "gift_items_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gift_items" validate constraint "gift_items_date_id_wedding_name_id_fkey";

alter table "public"."gift_registries" add constraint "gift_registries_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gift_registries" validate constraint "gift_registries_date_id_wedding_name_id_fkey";

alter table "public"."guests" add constraint "guests_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."guests" validate constraint "guests_date_id_wedding_name_id_fkey";

alter table "public"."rsvps" add constraint "rsvps_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."rsvps" validate constraint "rsvps_date_id_wedding_name_id_fkey";

alter table "public"."wedding_faqs" add constraint "wedding_faqs_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."wedding_faqs" validate constraint "wedding_faqs_date_id_wedding_name_id_fkey";

alter table "public"."wedding_pages" add constraint "wedding_pages_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."wedding_pages" validate constraint "wedding_pages_date_id_wedding_name_id_fkey";

alter table "public"."wedding_schedule" add constraint "wedding_schedule_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."wedding_schedule" validate constraint "wedding_schedule_date_id_wedding_name_id_fkey";

alter table "public"."weddings" add constraint "weddings_date_id_wedding_name_id_key" UNIQUE using index "weddings_date_id_wedding_name_id_key";


  create policy "Wedding owners can manage gallery"
  on "public"."gallery_albums"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage photos"
  on "public"."gallery_photos"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage gift items"
  on "public"."gift_items"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage registries"
  on "public"."gift_registries"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage FAQs"
  on "public"."wedding_faqs"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage pages"
  on "public"."wedding_pages"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage schedule"
  on "public"."wedding_schedule"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



