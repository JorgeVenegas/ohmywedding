
  create table "public"."guest_groups" (
    "id" uuid not null default gen_random_uuid(),
    "wedding_name_id" text not null,
    "name" text not null,
    "phone_number" text,
    "tags" text[] default '{}'::text[],
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."guest_groups" enable row level security;

alter table "public"."guests" drop column "attending";

alter table "public"."guests" drop column "companions";

alter table "public"."guests" drop column "message";

alter table "public"."guests" add column "confirmation_status" text default 'pending'::text;

alter table "public"."guests" add column "guest_group_id" uuid;

alter table "public"."guests" add column "notes" text;

alter table "public"."guests" alter column "email" drop not null;

CREATE UNIQUE INDEX guest_groups_pkey ON public.guest_groups USING btree (id);

CREATE INDEX idx_guest_groups_wedding_name_id ON public.guest_groups USING btree (wedding_name_id);

CREATE INDEX idx_guests_confirmation_status ON public.guests USING btree (confirmation_status);

CREATE INDEX idx_guests_guest_group_id ON public.guests USING btree (guest_group_id);

alter table "public"."guest_groups" add constraint "guest_groups_pkey" PRIMARY KEY using index "guest_groups_pkey";

alter table "public"."guest_groups" add constraint "guest_groups_wedding_name_id_fkey" FOREIGN KEY (wedding_name_id) REFERENCES public.weddings(wedding_name_id) ON DELETE CASCADE not valid;

alter table "public"."guest_groups" validate constraint "guest_groups_wedding_name_id_fkey";

alter table "public"."guests" add constraint "guests_confirmation_status_check" CHECK ((confirmation_status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'declined'::text]))) not valid;

alter table "public"."guests" validate constraint "guests_confirmation_status_check";

alter table "public"."guests" add constraint "guests_guest_group_id_fkey" FOREIGN KEY (guest_group_id) REFERENCES public.guest_groups(id) ON DELETE SET NULL not valid;

alter table "public"."guests" validate constraint "guests_guest_group_id_fkey";

grant delete on table "public"."guest_groups" to "anon";

grant insert on table "public"."guest_groups" to "anon";

grant references on table "public"."guest_groups" to "anon";

grant select on table "public"."guest_groups" to "anon";

grant trigger on table "public"."guest_groups" to "anon";

grant truncate on table "public"."guest_groups" to "anon";

grant update on table "public"."guest_groups" to "anon";

grant delete on table "public"."guest_groups" to "authenticated";

grant insert on table "public"."guest_groups" to "authenticated";

grant references on table "public"."guest_groups" to "authenticated";

grant select on table "public"."guest_groups" to "authenticated";

grant trigger on table "public"."guest_groups" to "authenticated";

grant truncate on table "public"."guest_groups" to "authenticated";

grant update on table "public"."guest_groups" to "authenticated";

grant delete on table "public"."guest_groups" to "service_role";

grant insert on table "public"."guest_groups" to "service_role";

grant references on table "public"."guest_groups" to "service_role";

grant select on table "public"."guest_groups" to "service_role";

grant trigger on table "public"."guest_groups" to "service_role";

grant truncate on table "public"."guest_groups" to "service_role";

grant update on table "public"."guest_groups" to "service_role";


  create policy "Anyone can view guest groups"
  on "public"."guest_groups"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners and collaborators can manage guest groups"
  on "public"."guest_groups"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR ((( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text = ANY (weddings.collaborator_emails))))));



  create policy "Anyone can view guests"
  on "public"."guests"
  as permissive
  for select
  to public
using (true);



  create policy "Wedding owners and collaborators can manage guests"
  on "public"."guests"
  as permissive
  for all
  to public
using ((wedding_name_id IN ( SELECT weddings.wedding_name_id
   FROM public.weddings
  WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR ((( SELECT users.email
           FROM auth.users
          WHERE (users.id = auth.uid())))::text = ANY (weddings.collaborator_emails))))));



