create extension if not exists "pg_net" with schema "extensions";

drop policy if exists "Anyone can view guest groups" on "public"."guest_groups";

drop policy if exists "Anyone can view guests" on "public"."guests";

drop policy "Wedding owners and collaborators can manage images" on "public"."images";

drop policy "Wedding owners and collaborators can manage registry contributi" on "public"."registry_contributions";

drop policy "Wedding owners and collaborators can manage rsvps" on "public"."rsvps";

drop policy "Wedding owners and collaborators can manage custom registry ite" on "public"."custom_registry_items";

drop policy "Wedding owners and collaborators can manage gallery" on "public"."gallery_albums";

drop policy "Wedding owners and collaborators can manage photos" on "public"."gallery_photos";

drop policy "Wedding owners and collaborators can manage gift items" on "public"."gift_items";

drop policy "Wedding owners and collaborators can manage registries" on "public"."gift_registries";

drop policy "Wedding owners and collaborators can manage guest groups" on "public"."guest_groups";

drop policy "Wedding owners and collaborators can manage guests" on "public"."guests";

drop policy "Wedding owners and collaborators can manage FAQs" on "public"."wedding_faqs";

drop policy "Wedding owners and collaborators can manage pages" on "public"."wedding_pages";

drop policy "Wedding owners and collaborators can manage schedule" on "public"."wedding_schedule";

drop policy "Owners and collaborators can update weddings" on "public"."weddings";

drop function if exists "public"."get_current_user_email"();


  create table "public"."rsvp_otp_verifications" (
    "id" uuid not null default gen_random_uuid(),
    "guest_group_id" uuid not null,
    "phone_number" text not null,
    "verified" boolean default false,
    "verification_token" text,
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone default now(),
    "verified_at" timestamp with time zone
      );


alter table "public"."rsvp_otp_verifications" enable row level security;

CREATE INDEX idx_otp_expiry ON public.rsvp_otp_verifications USING btree (expires_at) WHERE (verified = false);

CREATE INDEX idx_otp_phone_group ON public.rsvp_otp_verifications USING btree (guest_group_id, phone_number) WHERE (verified = false);

CREATE INDEX idx_otp_token ON public.rsvp_otp_verifications USING btree (verification_token) WHERE (verified = true);

CREATE UNIQUE INDEX rsvp_otp_verifications_pkey ON public.rsvp_otp_verifications USING btree (id);

alter table "public"."rsvp_otp_verifications" add constraint "rsvp_otp_verifications_pkey" PRIMARY KEY using index "rsvp_otp_verifications_pkey";

alter table "public"."rsvp_otp_verifications" add constraint "rsvp_otp_verifications_guest_group_id_fkey" FOREIGN KEY (guest_group_id) REFERENCES public.guest_groups(id) ON DELETE CASCADE not valid;

alter table "public"."rsvp_otp_verifications" validate constraint "rsvp_otp_verifications_guest_group_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  delete from rsvp_otp_verifications
  where expires_at < now() and verified = false;
end;
$function$
;

grant delete on table "public"."rsvp_otp_verifications" to "anon";

grant insert on table "public"."rsvp_otp_verifications" to "anon";

grant references on table "public"."rsvp_otp_verifications" to "anon";

grant select on table "public"."rsvp_otp_verifications" to "anon";

grant trigger on table "public"."rsvp_otp_verifications" to "anon";

grant truncate on table "public"."rsvp_otp_verifications" to "anon";

grant update on table "public"."rsvp_otp_verifications" to "anon";

grant delete on table "public"."rsvp_otp_verifications" to "authenticated";

grant insert on table "public"."rsvp_otp_verifications" to "authenticated";

grant references on table "public"."rsvp_otp_verifications" to "authenticated";

grant select on table "public"."rsvp_otp_verifications" to "authenticated";

grant trigger on table "public"."rsvp_otp_verifications" to "authenticated";

grant truncate on table "public"."rsvp_otp_verifications" to "authenticated";

grant update on table "public"."rsvp_otp_verifications" to "authenticated";

grant delete on table "public"."rsvp_otp_verifications" to "service_role";

grant insert on table "public"."rsvp_otp_verifications" to "service_role";

grant references on table "public"."rsvp_otp_verifications" to "service_role";

grant select on table "public"."rsvp_otp_verifications" to "service_role";

grant trigger on table "public"."rsvp_otp_verifications" to "service_role";

grant truncate on table "public"."rsvp_otp_verifications" to "service_role";

grant update on table "public"."rsvp_otp_verifications" to "service_role";


  create policy "Wedding owners can manage images"
  on "public"."images"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Allow verification updates"
  on "public"."rsvp_otp_verifications"
  as permissive
  for update
  to public
using (true);



  create policy "Anyone can request OTP verification"
  on "public"."rsvp_otp_verifications"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can read their verification status"
  on "public"."rsvp_otp_verifications"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners and collaborators can manage custom registry ite"
  on "public"."custom_registry_items"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage gallery"
  on "public"."gallery_albums"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage photos"
  on "public"."gallery_photos"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage gift items"
  on "public"."gift_items"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage registries"
  on "public"."gift_registries"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage guest groups"
  on "public"."guest_groups"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))))
with check ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage guests"
  on "public"."guests"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))))
with check ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage FAQs"
  on "public"."wedding_faqs"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage pages"
  on "public"."wedding_pages"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Wedding owners and collaborators can manage schedule"
  on "public"."wedding_schedule"
  as permissive
  for all
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR (auth.email() = ANY (weddings.collaborator_emails))))));



  create policy "Owners and collaborators can update weddings"
  on "public"."weddings"
  as permissive
  for update
  to public
using (((owner_id = auth.uid()) OR (owner_id IS NULL) OR ((auth.jwt() ->> 'email'::text) = ANY (collaborator_emails))));



