drop policy "Wedding owners can manage gallery" on "public"."gallery_albums";

drop policy "Wedding owners can manage photos" on "public"."gallery_photos";

drop policy "Wedding owners can manage gift items" on "public"."gift_items";

drop policy "Wedding owners can manage registries" on "public"."gift_registries";

drop policy "Wedding owners can manage FAQs" on "public"."wedding_faqs";

drop policy "Wedding owners can manage pages" on "public"."wedding_pages";

drop policy "Wedding owners can manage schedule" on "public"."wedding_schedule";

alter table "public"."gallery_albums" drop constraint "gallery_albums_date_id_wedding_name_id_fkey";

alter table "public"."gallery_photos" drop constraint "gallery_photos_date_id_wedding_name_id_fkey";

alter table "public"."gift_items" drop constraint "gift_items_date_id_wedding_name_id_fkey";

alter table "public"."gift_registries" drop constraint "gift_registries_date_id_wedding_name_id_fkey";

alter table "public"."guests" drop constraint "guests_date_id_wedding_name_id_fkey";

alter table "public"."rsvps" drop constraint "rsvps_date_id_wedding_name_id_fkey";

alter table "public"."wedding_faqs" drop constraint "wedding_faqs_date_id_wedding_name_id_fkey";

alter table "public"."wedding_pages" drop constraint "wedding_pages_date_id_wedding_name_id_fkey";

alter table "public"."wedding_schedule" drop constraint "wedding_schedule_date_id_wedding_name_id_fkey";

alter table "public"."weddings" drop constraint "weddings_date_id_wedding_name_id_key";

drop index if exists "public"."idx_gallery_albums_compound_key";

drop index if exists "public"."idx_gallery_photos_compound_key";

drop index if exists "public"."idx_gift_items_compound_key";

drop index if exists "public"."idx_gift_registries_compound_key";

drop index if exists "public"."idx_guests_compound_key";

drop index if exists "public"."idx_rsvps_compound_key";

drop index if exists "public"."idx_wedding_faqs_compound_key";

drop index if exists "public"."idx_wedding_pages_compound_key";

drop index if exists "public"."idx_wedding_schedule_compound_key";

drop index if exists "public"."weddings_date_id_wedding_name_id_key";


  create table "public"."images" (
    "id" uuid not null default gen_random_uuid(),
    "wedding_name_id" text not null,
    "url" text not null,
    "storage_path" text not null,
    "filename" text not null,
    "size" integer,
    "mime_type" text,
    "caption" text,
    "alt_text" text,
    "uploaded_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."images" enable row level security;

alter table "public"."gallery_albums" drop column "date_id";

alter table "public"."gallery_photos" drop column "date_id";

alter table "public"."gift_items" drop column "date_id";

alter table "public"."gift_registries" drop column "date_id";

alter table "public"."guests" drop column "date_id";

alter table "public"."rsvps" drop column "date_id";

alter table "public"."wedding_faqs" drop column "date_id";

alter table "public"."wedding_pages" drop column "date_id";

alter table "public"."wedding_schedule" drop column "date_id";

CREATE INDEX idx_gallery_albums_wedding_name_id ON public.gallery_albums USING btree (wedding_name_id);

CREATE INDEX idx_gallery_photos_wedding_name_id ON public.gallery_photos USING btree (wedding_name_id);

CREATE INDEX idx_gift_items_wedding_name_id ON public.gift_items USING btree (wedding_name_id);

CREATE INDEX idx_gift_registries_wedding_name_id ON public.gift_registries USING btree (wedding_name_id);

CREATE INDEX idx_guests_wedding_name_id ON public.guests USING btree (wedding_name_id);

CREATE INDEX idx_images_uploaded_by ON public.images USING btree (uploaded_by);

CREATE INDEX idx_images_wedding ON public.images USING btree (wedding_name_id);

CREATE INDEX idx_rsvps_wedding_name_id ON public.rsvps USING btree (wedding_name_id);

CREATE INDEX idx_wedding_faqs_wedding_name_id ON public.wedding_faqs USING btree (wedding_name_id);

CREATE INDEX idx_wedding_pages_wedding_name_id ON public.wedding_pages USING btree (wedding_name_id);

CREATE INDEX idx_wedding_schedule_wedding_name_id ON public.wedding_schedule USING btree (wedding_name_id);

CREATE UNIQUE INDEX images_pkey ON public.images USING btree (id);

CREATE UNIQUE INDEX weddings_wedding_name_id_key ON public.weddings USING btree (wedding_name_id);

alter table "public"."images" add constraint "images_pkey" PRIMARY KEY using index "images_pkey";

alter table "public"."gallery_albums" add constraint "gallery_albums_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gallery_albums" validate constraint "gallery_albums_wedding_name_id_fkey";

alter table "public"."gallery_photos" add constraint "gallery_photos_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gallery_photos" validate constraint "gallery_photos_wedding_name_id_fkey";

alter table "public"."gift_items" add constraint "gift_items_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gift_items" validate constraint "gift_items_wedding_name_id_fkey";

alter table "public"."gift_registries" add constraint "gift_registries_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gift_registries" validate constraint "gift_registries_wedding_name_id_fkey";

alter table "public"."guests" add constraint "guests_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."guests" validate constraint "guests_wedding_name_id_fkey";

alter table "public"."images" add constraint "images_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."images" validate constraint "images_uploaded_by_fkey";

alter table "public"."images" add constraint "images_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."images" validate constraint "images_wedding_name_id_fkey";

alter table "public"."rsvps" add constraint "rsvps_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."rsvps" validate constraint "rsvps_wedding_name_id_fkey";

alter table "public"."wedding_faqs" add constraint "wedding_faqs_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."wedding_faqs" validate constraint "wedding_faqs_wedding_name_id_fkey";

alter table "public"."wedding_pages" add constraint "wedding_pages_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."wedding_pages" validate constraint "wedding_pages_wedding_name_id_fkey";

alter table "public"."wedding_schedule" add constraint "wedding_schedule_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."wedding_schedule" validate constraint "wedding_schedule_wedding_name_id_fkey";

alter table "public"."weddings" add constraint "weddings_wedding_name_id_key" UNIQUE using index "weddings_wedding_name_id_key";

grant delete on table "public"."images" to "anon";

grant insert on table "public"."images" to "anon";

grant references on table "public"."images" to "anon";

grant select on table "public"."images" to "anon";

grant trigger on table "public"."images" to "anon";

grant truncate on table "public"."images" to "anon";

grant update on table "public"."images" to "anon";

grant delete on table "public"."images" to "authenticated";

grant insert on table "public"."images" to "authenticated";

grant references on table "public"."images" to "authenticated";

grant select on table "public"."images" to "authenticated";

grant trigger on table "public"."images" to "authenticated";

grant truncate on table "public"."images" to "authenticated";

grant update on table "public"."images" to "authenticated";

grant delete on table "public"."images" to "service_role";

grant insert on table "public"."images" to "service_role";

grant references on table "public"."images" to "service_role";

grant select on table "public"."images" to "service_role";

grant trigger on table "public"."images" to "service_role";

grant truncate on table "public"."images" to "service_role";

grant update on table "public"."images" to "service_role";


  create policy "Anyone can upload images"
  on "public"."images"
  as permissive
  for insert
  to public
with check (true);



  create policy "Anyone can view images"
  on "public"."images"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners can manage images"
  on "public"."images"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage gallery"
  on "public"."gallery_albums"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage photos"
  on "public"."gallery_photos"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage gift items"
  on "public"."gift_items"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage registries"
  on "public"."gift_registries"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage FAQs"
  on "public"."wedding_faqs"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage pages"
  on "public"."wedding_pages"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can manage schedule"
  on "public"."wedding_schedule"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



