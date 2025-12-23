drop policy "Wedding owners and collaborators can manage RSVPs" on "public"."rsvps";

drop policy "Wedding owners and collaborators can manage gallery" on "public"."gallery_albums";

drop policy "Wedding owners and collaborators can manage photos" on "public"."gallery_photos";

drop policy "Wedding owners and collaborators can manage gift items" on "public"."gift_items";

drop policy "Wedding owners and collaborators can manage registries" on "public"."gift_registries";

drop policy "Wedding owners and collaborators can manage FAQs" on "public"."wedding_faqs";

drop policy "Wedding owners and collaborators can manage pages" on "public"."wedding_pages";

drop policy "Wedding owners and collaborators can manage schedule" on "public"."wedding_schedule";


  create table "public"."custom_registry_items" (
    "id" uuid not null default gen_random_uuid(),
    "wedding_name_id" text not null,
    "title" text not null,
    "description" text,
    "goal_amount" numeric(10,2) not null default 0,
    "current_amount" numeric(10,2) not null default 0,
    "image_urls" text[] default '{}'::text[],
    "is_active" boolean default true,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."custom_registry_items" enable row level security;


  create table "public"."registry_contributions" (
    "id" uuid not null default gen_random_uuid(),
    "custom_registry_item_id" uuid not null,
    "wedding_name_id" text not null,
    "contributor_name" text,
    "contributor_email" text,
    "amount" numeric(10,2) not null,
    "message" text,
    "stripe_payment_intent_id" text,
    "stripe_checkout_session_id" text,
    "payment_status" text default 'pending'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."registry_contributions" enable row level security;

CREATE UNIQUE INDEX custom_registry_items_pkey ON public.custom_registry_items USING btree (id);

CREATE UNIQUE INDEX registry_contributions_pkey ON public.registry_contributions USING btree (id);

CREATE UNIQUE INDEX registry_contributions_stripe_checkout_session_id_key ON public.registry_contributions USING btree (stripe_checkout_session_id);

CREATE UNIQUE INDEX registry_contributions_stripe_payment_intent_id_key ON public.registry_contributions USING btree (stripe_payment_intent_id);

alter table "public"."custom_registry_items" add constraint "custom_registry_items_pkey" PRIMARY KEY using index "custom_registry_items_pkey";

alter table "public"."registry_contributions" add constraint "registry_contributions_pkey" PRIMARY KEY using index "registry_contributions_pkey";

alter table "public"."custom_registry_items" add constraint "custom_registry_items_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."custom_registry_items" validate constraint "custom_registry_items_wedding_name_id_fkey";

alter table "public"."registry_contributions" add constraint "registry_contributions_custom_registry_item_id_fkey" FOREIGN KEY (custom_registry_item_id) REFERENCES public.custom_registry_items(id) ON DELETE CASCADE not valid;

alter table "public"."registry_contributions" validate constraint "registry_contributions_custom_registry_item_id_fkey";

alter table "public"."registry_contributions" add constraint "registry_contributions_stripe_checkout_session_id_key" UNIQUE using index "registry_contributions_stripe_checkout_session_id_key";

alter table "public"."registry_contributions" add constraint "registry_contributions_stripe_payment_intent_id_key" UNIQUE using index "registry_contributions_stripe_payment_intent_id_key";

alter table "public"."registry_contributions" add constraint "registry_contributions_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."registry_contributions" validate constraint "registry_contributions_wedding_name_id_fkey";

grant delete on table "public"."custom_registry_items" to "anon";

grant insert on table "public"."custom_registry_items" to "anon";

grant references on table "public"."custom_registry_items" to "anon";

grant select on table "public"."custom_registry_items" to "anon";

grant trigger on table "public"."custom_registry_items" to "anon";

grant truncate on table "public"."custom_registry_items" to "anon";

grant update on table "public"."custom_registry_items" to "anon";

grant delete on table "public"."custom_registry_items" to "authenticated";

grant insert on table "public"."custom_registry_items" to "authenticated";

grant references on table "public"."custom_registry_items" to "authenticated";

grant select on table "public"."custom_registry_items" to "authenticated";

grant trigger on table "public"."custom_registry_items" to "authenticated";

grant truncate on table "public"."custom_registry_items" to "authenticated";

grant update on table "public"."custom_registry_items" to "authenticated";

grant delete on table "public"."custom_registry_items" to "service_role";

grant insert on table "public"."custom_registry_items" to "service_role";

grant references on table "public"."custom_registry_items" to "service_role";

grant select on table "public"."custom_registry_items" to "service_role";

grant trigger on table "public"."custom_registry_items" to "service_role";

grant truncate on table "public"."custom_registry_items" to "service_role";

grant update on table "public"."custom_registry_items" to "service_role";

grant delete on table "public"."registry_contributions" to "anon";

grant insert on table "public"."registry_contributions" to "anon";

grant references on table "public"."registry_contributions" to "anon";

grant select on table "public"."registry_contributions" to "anon";

grant trigger on table "public"."registry_contributions" to "anon";

grant truncate on table "public"."registry_contributions" to "anon";

grant update on table "public"."registry_contributions" to "anon";

grant delete on table "public"."registry_contributions" to "authenticated";

grant insert on table "public"."registry_contributions" to "authenticated";

grant references on table "public"."registry_contributions" to "authenticated";

grant select on table "public"."registry_contributions" to "authenticated";

grant trigger on table "public"."registry_contributions" to "authenticated";

grant truncate on table "public"."registry_contributions" to "authenticated";

grant update on table "public"."registry_contributions" to "authenticated";

grant delete on table "public"."registry_contributions" to "service_role";

grant insert on table "public"."registry_contributions" to "service_role";

grant references on table "public"."registry_contributions" to "service_role";

grant select on table "public"."registry_contributions" to "service_role";

grant trigger on table "public"."registry_contributions" to "service_role";

grant truncate on table "public"."registry_contributions" to "service_role";

grant update on table "public"."registry_contributions" to "service_role";


  create policy "Anyone can view active custom registry items"
  on "public"."custom_registry_items"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Wedding owners and collaborators can manage custom registry ite"
  on "public"."custom_registry_items"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Anyone can create registry contributions"
  on "public"."registry_contributions"
  as permissive
  for insert
  to public
with check (true);



  create policy "Owners and collaborators can view registry contributions"
  on "public"."registry_contributions"
  as permissive
  for select
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can update registry contributi"
  on "public"."registry_contributions"
  as permissive
  for update
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage gallery"
  on "public"."gallery_albums"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage photos"
  on "public"."gallery_photos"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage gift items"
  on "public"."gift_items"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage registries"
  on "public"."gift_registries"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage FAQs"
  on "public"."wedding_faqs"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage pages"
  on "public"."wedding_pages"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage schedule"
  on "public"."wedding_schedule"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



