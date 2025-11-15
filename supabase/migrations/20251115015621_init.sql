
  create table "public"."gallery_albums" (
    "id" uuid not null default gen_random_uuid(),
    "date_id" text not null,
    "wedding_name_id" text not null,
    "name" text not null,
    "description" text,
    "cover_photo_url" text,
    "is_public" boolean default true,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."gallery_albums" enable row level security;


  create table "public"."gallery_photos" (
    "id" uuid not null default gen_random_uuid(),
    "album_id" uuid,
    "date_id" text not null,
    "wedding_name_id" text not null,
    "title" text,
    "description" text,
    "photo_url" text not null,
    "thumbnail_url" text,
    "uploaded_by" text,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."gallery_photos" enable row level security;


  create table "public"."gift_items" (
    "id" uuid not null default gen_random_uuid(),
    "registry_id" uuid,
    "date_id" text not null,
    "wedding_name_id" text not null,
    "item_name" text not null,
    "description" text,
    "price" numeric(10,2),
    "item_url" text,
    "image_url" text,
    "is_purchased" boolean default false,
    "purchased_by" text,
    "purchased_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."gift_items" enable row level security;


  create table "public"."gift_registries" (
    "id" uuid not null default gen_random_uuid(),
    "date_id" text not null,
    "wedding_name_id" text not null,
    "registry_name" text not null,
    "store_name" text,
    "registry_url" text,
    "description" text,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."gift_registries" enable row level security;


  create table "public"."guests" (
    "id" uuid not null default gen_random_uuid(),
    "date_id" text not null,
    "wedding_name_id" text not null,
    "name" text not null,
    "email" text not null,
    "attending" text default 'pending'::text,
    "companions" integer default 0,
    "dietary_restrictions" text,
    "message" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."guests" enable row level security;


  create table "public"."rsvps" (
    "id" uuid not null default gen_random_uuid(),
    "date_id" text not null,
    "wedding_name_id" text not null,
    "guest_name" text not null,
    "guest_email" text not null,
    "attending" text not null,
    "companions" integer default 0,
    "dietary_restrictions" text,
    "message" text,
    "submitted_at" timestamp with time zone default now()
      );


alter table "public"."rsvps" enable row level security;


  create table "public"."wedding_faqs" (
    "id" uuid not null default gen_random_uuid(),
    "date_id" text not null,
    "wedding_name_id" text not null,
    "question" text not null,
    "answer" text not null,
    "display_order" integer default 0,
    "is_visible" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."wedding_faqs" enable row level security;


  create table "public"."wedding_pages" (
    "id" uuid not null default gen_random_uuid(),
    "date_id" text not null,
    "wedding_name_id" text not null,
    "page_type" text not null,
    "title" text not null,
    "content" text,
    "is_enabled" boolean default true,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."wedding_pages" enable row level security;


  create table "public"."wedding_schedule" (
    "id" uuid not null default gen_random_uuid(),
    "date_id" text not null,
    "wedding_name_id" text not null,
    "event_name" text not null,
    "event_time" time without time zone not null,
    "event_description" text,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."wedding_schedule" enable row level security;


  create table "public"."weddings" (
    "id" uuid not null default gen_random_uuid(),
    "date_id" text not null,
    "wedding_name_id" text not null,
    "partner1_first_name" text not null,
    "partner1_last_name" text not null,
    "partner2_first_name" text not null,
    "partner2_last_name" text not null,
    "wedding_date" date not null,
    "wedding_time" time without time zone not null,
    "story" text,
    "primary_color" text default '#d4a574'::text,
    "secondary_color" text default '#9ba082'::text,
    "accent_color" text default '#e6b5a3'::text,
    "ceremony_venue_name" text,
    "ceremony_venue_address" text,
    "reception_venue_name" text,
    "reception_venue_address" text,
    "owner_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."weddings" enable row level security;

CREATE UNIQUE INDEX gallery_albums_pkey ON public.gallery_albums USING btree (id);

CREATE UNIQUE INDEX gallery_photos_pkey ON public.gallery_photos USING btree (id);

CREATE UNIQUE INDEX gift_items_pkey ON public.gift_items USING btree (id);

CREATE UNIQUE INDEX gift_registries_pkey ON public.gift_registries USING btree (id);

CREATE UNIQUE INDEX guests_pkey ON public.guests USING btree (id);

CREATE INDEX idx_gallery_albums_compound_key ON public.gallery_albums USING btree (date_id, wedding_name_id);

CREATE INDEX idx_gallery_photos_album_id ON public.gallery_photos USING btree (album_id);

CREATE INDEX idx_gallery_photos_compound_key ON public.gallery_photos USING btree (date_id, wedding_name_id);

CREATE INDEX idx_gift_items_compound_key ON public.gift_items USING btree (date_id, wedding_name_id);

CREATE INDEX idx_gift_items_registry_id ON public.gift_items USING btree (registry_id);

CREATE INDEX idx_gift_registries_compound_key ON public.gift_registries USING btree (date_id, wedding_name_id);

CREATE INDEX idx_guests_compound_key ON public.guests USING btree (date_id, wedding_name_id);

CREATE INDEX idx_guests_email ON public.guests USING btree (email);

CREATE INDEX idx_rsvps_compound_key ON public.rsvps USING btree (date_id, wedding_name_id);

CREATE INDEX idx_rsvps_email ON public.rsvps USING btree (guest_email);

CREATE INDEX idx_wedding_faqs_compound_key ON public.wedding_faqs USING btree (date_id, wedding_name_id);

CREATE INDEX idx_wedding_pages_compound_key ON public.wedding_pages USING btree (date_id, wedding_name_id);

CREATE INDEX idx_wedding_schedule_compound_key ON public.wedding_schedule USING btree (date_id, wedding_name_id);

CREATE INDEX idx_weddings_compound_key ON public.weddings USING btree (date_id, wedding_name_id);

CREATE INDEX idx_weddings_date_id ON public.weddings USING btree (date_id);

CREATE INDEX idx_weddings_owner_id ON public.weddings USING btree (owner_id);

CREATE INDEX idx_weddings_wedding_date ON public.weddings USING btree (wedding_date);

CREATE INDEX idx_weddings_wedding_name_id ON public.weddings USING btree (wedding_name_id);

CREATE UNIQUE INDEX rsvps_pkey ON public.rsvps USING btree (id);

CREATE UNIQUE INDEX wedding_faqs_pkey ON public.wedding_faqs USING btree (id);

CREATE UNIQUE INDEX wedding_pages_pkey ON public.wedding_pages USING btree (id);

CREATE UNIQUE INDEX wedding_schedule_pkey ON public.wedding_schedule USING btree (id);

CREATE UNIQUE INDEX weddings_date_id_wedding_name_id_key ON public.weddings USING btree (date_id, wedding_name_id);

CREATE UNIQUE INDEX weddings_pkey ON public.weddings USING btree (id);

alter table "public"."gallery_albums" add constraint "gallery_albums_pkey" PRIMARY KEY using index "gallery_albums_pkey";

alter table "public"."gallery_photos" add constraint "gallery_photos_pkey" PRIMARY KEY using index "gallery_photos_pkey";

alter table "public"."gift_items" add constraint "gift_items_pkey" PRIMARY KEY using index "gift_items_pkey";

alter table "public"."gift_registries" add constraint "gift_registries_pkey" PRIMARY KEY using index "gift_registries_pkey";

alter table "public"."guests" add constraint "guests_pkey" PRIMARY KEY using index "guests_pkey";

alter table "public"."rsvps" add constraint "rsvps_pkey" PRIMARY KEY using index "rsvps_pkey";

alter table "public"."wedding_faqs" add constraint "wedding_faqs_pkey" PRIMARY KEY using index "wedding_faqs_pkey";

alter table "public"."wedding_pages" add constraint "wedding_pages_pkey" PRIMARY KEY using index "wedding_pages_pkey";

alter table "public"."wedding_schedule" add constraint "wedding_schedule_pkey" PRIMARY KEY using index "wedding_schedule_pkey";

alter table "public"."weddings" add constraint "weddings_pkey" PRIMARY KEY using index "weddings_pkey";

alter table "public"."gallery_albums" add constraint "gallery_albums_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gallery_albums" validate constraint "gallery_albums_date_id_wedding_name_id_fkey";

alter table "public"."gallery_photos" add constraint "gallery_photos_album_id_fkey" FOREIGN KEY (album_id) REFERENCES public.gallery_albums(id) ON DELETE CASCADE not valid;

alter table "public"."gallery_photos" validate constraint "gallery_photos_album_id_fkey";

alter table "public"."gallery_photos" add constraint "gallery_photos_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gallery_photos" validate constraint "gallery_photos_date_id_wedding_name_id_fkey";

alter table "public"."gift_items" add constraint "gift_items_date_id_wedding_name_id_fkey" FOREIGN KEY (date_id, wedding_name_id) REFERENCES public.weddings(date_id, wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."gift_items" validate constraint "gift_items_date_id_wedding_name_id_fkey";

alter table "public"."gift_items" add constraint "gift_items_registry_id_fkey" FOREIGN KEY (registry_id) REFERENCES public.gift_registries(id) ON DELETE CASCADE not valid;

alter table "public"."gift_items" validate constraint "gift_items_registry_id_fkey";

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

grant delete on table "public"."gallery_albums" to "anon";

grant insert on table "public"."gallery_albums" to "anon";

grant references on table "public"."gallery_albums" to "anon";

grant select on table "public"."gallery_albums" to "anon";

grant trigger on table "public"."gallery_albums" to "anon";

grant truncate on table "public"."gallery_albums" to "anon";

grant update on table "public"."gallery_albums" to "anon";

grant delete on table "public"."gallery_albums" to "authenticated";

grant insert on table "public"."gallery_albums" to "authenticated";

grant references on table "public"."gallery_albums" to "authenticated";

grant select on table "public"."gallery_albums" to "authenticated";

grant trigger on table "public"."gallery_albums" to "authenticated";

grant truncate on table "public"."gallery_albums" to "authenticated";

grant update on table "public"."gallery_albums" to "authenticated";

grant delete on table "public"."gallery_albums" to "service_role";

grant insert on table "public"."gallery_albums" to "service_role";

grant references on table "public"."gallery_albums" to "service_role";

grant select on table "public"."gallery_albums" to "service_role";

grant trigger on table "public"."gallery_albums" to "service_role";

grant truncate on table "public"."gallery_albums" to "service_role";

grant update on table "public"."gallery_albums" to "service_role";

grant delete on table "public"."gallery_photos" to "anon";

grant insert on table "public"."gallery_photos" to "anon";

grant references on table "public"."gallery_photos" to "anon";

grant select on table "public"."gallery_photos" to "anon";

grant trigger on table "public"."gallery_photos" to "anon";

grant truncate on table "public"."gallery_photos" to "anon";

grant update on table "public"."gallery_photos" to "anon";

grant delete on table "public"."gallery_photos" to "authenticated";

grant insert on table "public"."gallery_photos" to "authenticated";

grant references on table "public"."gallery_photos" to "authenticated";

grant select on table "public"."gallery_photos" to "authenticated";

grant trigger on table "public"."gallery_photos" to "authenticated";

grant truncate on table "public"."gallery_photos" to "authenticated";

grant update on table "public"."gallery_photos" to "authenticated";

grant delete on table "public"."gallery_photos" to "service_role";

grant insert on table "public"."gallery_photos" to "service_role";

grant references on table "public"."gallery_photos" to "service_role";

grant select on table "public"."gallery_photos" to "service_role";

grant trigger on table "public"."gallery_photos" to "service_role";

grant truncate on table "public"."gallery_photos" to "service_role";

grant update on table "public"."gallery_photos" to "service_role";

grant delete on table "public"."gift_items" to "anon";

grant insert on table "public"."gift_items" to "anon";

grant references on table "public"."gift_items" to "anon";

grant select on table "public"."gift_items" to "anon";

grant trigger on table "public"."gift_items" to "anon";

grant truncate on table "public"."gift_items" to "anon";

grant update on table "public"."gift_items" to "anon";

grant delete on table "public"."gift_items" to "authenticated";

grant insert on table "public"."gift_items" to "authenticated";

grant references on table "public"."gift_items" to "authenticated";

grant select on table "public"."gift_items" to "authenticated";

grant trigger on table "public"."gift_items" to "authenticated";

grant truncate on table "public"."gift_items" to "authenticated";

grant update on table "public"."gift_items" to "authenticated";

grant delete on table "public"."gift_items" to "service_role";

grant insert on table "public"."gift_items" to "service_role";

grant references on table "public"."gift_items" to "service_role";

grant select on table "public"."gift_items" to "service_role";

grant trigger on table "public"."gift_items" to "service_role";

grant truncate on table "public"."gift_items" to "service_role";

grant update on table "public"."gift_items" to "service_role";

grant delete on table "public"."gift_registries" to "anon";

grant insert on table "public"."gift_registries" to "anon";

grant references on table "public"."gift_registries" to "anon";

grant select on table "public"."gift_registries" to "anon";

grant trigger on table "public"."gift_registries" to "anon";

grant truncate on table "public"."gift_registries" to "anon";

grant update on table "public"."gift_registries" to "anon";

grant delete on table "public"."gift_registries" to "authenticated";

grant insert on table "public"."gift_registries" to "authenticated";

grant references on table "public"."gift_registries" to "authenticated";

grant select on table "public"."gift_registries" to "authenticated";

grant trigger on table "public"."gift_registries" to "authenticated";

grant truncate on table "public"."gift_registries" to "authenticated";

grant update on table "public"."gift_registries" to "authenticated";

grant delete on table "public"."gift_registries" to "service_role";

grant insert on table "public"."gift_registries" to "service_role";

grant references on table "public"."gift_registries" to "service_role";

grant select on table "public"."gift_registries" to "service_role";

grant trigger on table "public"."gift_registries" to "service_role";

grant truncate on table "public"."gift_registries" to "service_role";

grant update on table "public"."gift_registries" to "service_role";

grant delete on table "public"."guests" to "anon";

grant insert on table "public"."guests" to "anon";

grant references on table "public"."guests" to "anon";

grant select on table "public"."guests" to "anon";

grant trigger on table "public"."guests" to "anon";

grant truncate on table "public"."guests" to "anon";

grant update on table "public"."guests" to "anon";

grant delete on table "public"."guests" to "authenticated";

grant insert on table "public"."guests" to "authenticated";

grant references on table "public"."guests" to "authenticated";

grant select on table "public"."guests" to "authenticated";

grant trigger on table "public"."guests" to "authenticated";

grant truncate on table "public"."guests" to "authenticated";

grant update on table "public"."guests" to "authenticated";

grant delete on table "public"."guests" to "service_role";

grant insert on table "public"."guests" to "service_role";

grant references on table "public"."guests" to "service_role";

grant select on table "public"."guests" to "service_role";

grant trigger on table "public"."guests" to "service_role";

grant truncate on table "public"."guests" to "service_role";

grant update on table "public"."guests" to "service_role";

grant delete on table "public"."rsvps" to "anon";

grant insert on table "public"."rsvps" to "anon";

grant references on table "public"."rsvps" to "anon";

grant select on table "public"."rsvps" to "anon";

grant trigger on table "public"."rsvps" to "anon";

grant truncate on table "public"."rsvps" to "anon";

grant update on table "public"."rsvps" to "anon";

grant delete on table "public"."rsvps" to "authenticated";

grant insert on table "public"."rsvps" to "authenticated";

grant references on table "public"."rsvps" to "authenticated";

grant select on table "public"."rsvps" to "authenticated";

grant trigger on table "public"."rsvps" to "authenticated";

grant truncate on table "public"."rsvps" to "authenticated";

grant update on table "public"."rsvps" to "authenticated";

grant delete on table "public"."rsvps" to "service_role";

grant insert on table "public"."rsvps" to "service_role";

grant references on table "public"."rsvps" to "service_role";

grant select on table "public"."rsvps" to "service_role";

grant trigger on table "public"."rsvps" to "service_role";

grant truncate on table "public"."rsvps" to "service_role";

grant update on table "public"."rsvps" to "service_role";

grant delete on table "public"."wedding_faqs" to "anon";

grant insert on table "public"."wedding_faqs" to "anon";

grant references on table "public"."wedding_faqs" to "anon";

grant select on table "public"."wedding_faqs" to "anon";

grant trigger on table "public"."wedding_faqs" to "anon";

grant truncate on table "public"."wedding_faqs" to "anon";

grant update on table "public"."wedding_faqs" to "anon";

grant delete on table "public"."wedding_faqs" to "authenticated";

grant insert on table "public"."wedding_faqs" to "authenticated";

grant references on table "public"."wedding_faqs" to "authenticated";

grant select on table "public"."wedding_faqs" to "authenticated";

grant trigger on table "public"."wedding_faqs" to "authenticated";

grant truncate on table "public"."wedding_faqs" to "authenticated";

grant update on table "public"."wedding_faqs" to "authenticated";

grant delete on table "public"."wedding_faqs" to "service_role";

grant insert on table "public"."wedding_faqs" to "service_role";

grant references on table "public"."wedding_faqs" to "service_role";

grant select on table "public"."wedding_faqs" to "service_role";

grant trigger on table "public"."wedding_faqs" to "service_role";

grant truncate on table "public"."wedding_faqs" to "service_role";

grant update on table "public"."wedding_faqs" to "service_role";

grant delete on table "public"."wedding_pages" to "anon";

grant insert on table "public"."wedding_pages" to "anon";

grant references on table "public"."wedding_pages" to "anon";

grant select on table "public"."wedding_pages" to "anon";

grant trigger on table "public"."wedding_pages" to "anon";

grant truncate on table "public"."wedding_pages" to "anon";

grant update on table "public"."wedding_pages" to "anon";

grant delete on table "public"."wedding_pages" to "authenticated";

grant insert on table "public"."wedding_pages" to "authenticated";

grant references on table "public"."wedding_pages" to "authenticated";

grant select on table "public"."wedding_pages" to "authenticated";

grant trigger on table "public"."wedding_pages" to "authenticated";

grant truncate on table "public"."wedding_pages" to "authenticated";

grant update on table "public"."wedding_pages" to "authenticated";

grant delete on table "public"."wedding_pages" to "service_role";

grant insert on table "public"."wedding_pages" to "service_role";

grant references on table "public"."wedding_pages" to "service_role";

grant select on table "public"."wedding_pages" to "service_role";

grant trigger on table "public"."wedding_pages" to "service_role";

grant truncate on table "public"."wedding_pages" to "service_role";

grant update on table "public"."wedding_pages" to "service_role";

grant delete on table "public"."wedding_schedule" to "anon";

grant insert on table "public"."wedding_schedule" to "anon";

grant references on table "public"."wedding_schedule" to "anon";

grant select on table "public"."wedding_schedule" to "anon";

grant trigger on table "public"."wedding_schedule" to "anon";

grant truncate on table "public"."wedding_schedule" to "anon";

grant update on table "public"."wedding_schedule" to "anon";

grant delete on table "public"."wedding_schedule" to "authenticated";

grant insert on table "public"."wedding_schedule" to "authenticated";

grant references on table "public"."wedding_schedule" to "authenticated";

grant select on table "public"."wedding_schedule" to "authenticated";

grant trigger on table "public"."wedding_schedule" to "authenticated";

grant truncate on table "public"."wedding_schedule" to "authenticated";

grant update on table "public"."wedding_schedule" to "authenticated";

grant delete on table "public"."wedding_schedule" to "service_role";

grant insert on table "public"."wedding_schedule" to "service_role";

grant references on table "public"."wedding_schedule" to "service_role";

grant select on table "public"."wedding_schedule" to "service_role";

grant trigger on table "public"."wedding_schedule" to "service_role";

grant truncate on table "public"."wedding_schedule" to "service_role";

grant update on table "public"."wedding_schedule" to "service_role";

grant delete on table "public"."weddings" to "anon";

grant insert on table "public"."weddings" to "anon";

grant references on table "public"."weddings" to "anon";

grant select on table "public"."weddings" to "anon";

grant trigger on table "public"."weddings" to "anon";

grant truncate on table "public"."weddings" to "anon";

grant update on table "public"."weddings" to "anon";

grant delete on table "public"."weddings" to "authenticated";

grant insert on table "public"."weddings" to "authenticated";

grant references on table "public"."weddings" to "authenticated";

grant select on table "public"."weddings" to "authenticated";

grant trigger on table "public"."weddings" to "authenticated";

grant truncate on table "public"."weddings" to "authenticated";

grant update on table "public"."weddings" to "authenticated";

grant delete on table "public"."weddings" to "service_role";

grant insert on table "public"."weddings" to "service_role";

grant references on table "public"."weddings" to "service_role";

grant select on table "public"."weddings" to "service_role";

grant trigger on table "public"."weddings" to "service_role";

grant truncate on table "public"."weddings" to "service_role";

grant update on table "public"."weddings" to "service_role";


  create policy "Anyone can view gallery albums"
  on "public"."gallery_albums"
  as permissive
  for select
  to public
using ((is_public = true));



  create policy "Wedding owners can manage gallery"
  on "public"."gallery_albums"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Anyone can view gallery photos"
  on "public"."gallery_photos"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners can manage photos"
  on "public"."gallery_photos"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Anyone can view gift items"
  on "public"."gift_items"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners can manage gift items"
  on "public"."gift_items"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Anyone can view gift registries"
  on "public"."gift_registries"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners can manage registries"
  on "public"."gift_registries"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Anyone can submit RSVPs"
  on "public"."rsvps"
  as permissive
  for insert
  to public
with check (true);



  create policy "Anyone can view RSVPs"
  on "public"."rsvps"
  as permissive
  for select
  to public
using (true);



  create policy "Anyone can view wedding FAQs"
  on "public"."wedding_faqs"
  as permissive
  for select
  to public
using ((is_visible = true));



  create policy "Wedding owners can manage FAQs"
  on "public"."wedding_faqs"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Anyone can view wedding pages"
  on "public"."wedding_pages"
  as permissive
  for select
  to public
using ((is_enabled = true));



  create policy "Wedding owners can manage pages"
  on "public"."wedding_pages"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Anyone can view wedding schedule"
  on "public"."wedding_schedule"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners can manage schedule"
  on "public"."wedding_schedule"
  as permissive
  for all
  to public
using (((date_id, wedding_name_id) IN ( SELECT weddings.date_id,
    weddings.wedding_name_id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Anyone can create weddings"
  on "public"."weddings"
  as permissive
  for insert
  to public
with check (true);



  create policy "Anyone can update weddings"
  on "public"."weddings"
  as permissive
  for update
  to public
using (true);



  create policy "Anyone can view wedding content"
  on "public"."weddings"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners can delete their weddings"
  on "public"."weddings"
  as permissive
  for delete
  to public
using ((auth.uid() = owner_id));



