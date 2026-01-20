-- Wedding Features and Settings tables

  create table "public"."wedding_features" (
    "id" uuid not null default gen_random_uuid(),
    "wedding_id" uuid not null,
    "rsvp_enabled" boolean not null default false,
    "invitations_panel_enabled" boolean not null default false,
    "gallery_enabled" boolean not null default true,
    "registry_enabled" boolean not null default true,
    "schedule_enabled" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."wedding_features" enable row level security;


  create table "public"."wedding_settings" (
    "id" uuid not null default gen_random_uuid(),
    "wedding_id" uuid not null,
    "rsvp_travel_confirmation_enabled" boolean not null default true,
    "rsvp_require_ticket_attachment" boolean not null default false,
    "rsvp_require_no_ticket_reason" boolean not null default false,
    "rsvp_allow_plus_ones" boolean not null default true,
    "rsvp_deadline" date,
    "invitation_default_message" text,
    "invitation_custom_fields" jsonb default '[]'::jsonb,
    "gallery_allow_guest_uploads" boolean not null default false,
    "gallery_moderation_enabled" boolean not null default true,
    "timezone" text default 'UTC'::text,
    "language" text default 'en'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."wedding_settings" enable row level security;

CREATE INDEX idx_wedding_features_wedding_id ON public.wedding_features USING btree (wedding_id);

CREATE INDEX idx_wedding_settings_wedding_id ON public.wedding_settings USING btree (wedding_id);

CREATE UNIQUE INDEX wedding_features_pkey ON public.wedding_features USING btree (id);

CREATE UNIQUE INDEX wedding_features_wedding_id_unique ON public.wedding_features USING btree (wedding_id);

CREATE UNIQUE INDEX wedding_settings_pkey ON public.wedding_settings USING btree (id);

CREATE UNIQUE INDEX wedding_settings_wedding_id_unique ON public.wedding_settings USING btree (wedding_id);

alter table "public"."wedding_features" add constraint "wedding_features_pkey" PRIMARY KEY using index "wedding_features_pkey";

alter table "public"."wedding_settings" add constraint "wedding_settings_pkey" PRIMARY KEY using index "wedding_settings_pkey";

alter table "public"."wedding_features" add constraint "wedding_features_wedding_id_fkey" FOREIGN KEY (wedding_id) REFERENCES public.weddings(id) ON DELETE CASCADE not valid;

alter table "public"."wedding_features" validate constraint "wedding_features_wedding_id_fkey";

alter table "public"."wedding_features" add constraint "wedding_features_wedding_id_unique" UNIQUE using index "wedding_features_wedding_id_unique";

alter table "public"."wedding_settings" add constraint "wedding_settings_wedding_id_fkey" FOREIGN KEY (wedding_id) REFERENCES public.weddings(id) ON DELETE CASCADE not valid;

alter table "public"."wedding_settings" validate constraint "wedding_settings_wedding_id_fkey";

alter table "public"."wedding_settings" add constraint "wedding_settings_wedding_id_unique" UNIQUE using index "wedding_settings_wedding_id_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."wedding_features" to "anon";

grant insert on table "public"."wedding_features" to "anon";

grant references on table "public"."wedding_features" to "anon";

grant select on table "public"."wedding_features" to "anon";

grant trigger on table "public"."wedding_features" to "anon";

grant truncate on table "public"."wedding_features" to "anon";

grant update on table "public"."wedding_features" to "anon";

grant delete on table "public"."wedding_features" to "authenticated";

grant insert on table "public"."wedding_features" to "authenticated";

grant references on table "public"."wedding_features" to "authenticated";

grant select on table "public"."wedding_features" to "authenticated";

grant trigger on table "public"."wedding_features" to "authenticated";

grant truncate on table "public"."wedding_features" to "authenticated";

grant update on table "public"."wedding_features" to "authenticated";

grant delete on table "public"."wedding_features" to "service_role";

grant insert on table "public"."wedding_features" to "service_role";

grant references on table "public"."wedding_features" to "service_role";

grant select on table "public"."wedding_features" to "service_role";

grant trigger on table "public"."wedding_features" to "service_role";

grant truncate on table "public"."wedding_features" to "service_role";

grant update on table "public"."wedding_features" to "service_role";

grant delete on table "public"."wedding_settings" to "anon";

grant insert on table "public"."wedding_settings" to "anon";

grant references on table "public"."wedding_settings" to "anon";

grant select on table "public"."wedding_settings" to "anon";

grant trigger on table "public"."wedding_settings" to "anon";

grant truncate on table "public"."wedding_settings" to "anon";

grant update on table "public"."wedding_settings" to "anon";

grant delete on table "public"."wedding_settings" to "authenticated";

grant insert on table "public"."wedding_settings" to "authenticated";

grant references on table "public"."wedding_settings" to "authenticated";

grant select on table "public"."wedding_settings" to "authenticated";

grant trigger on table "public"."wedding_settings" to "authenticated";

grant truncate on table "public"."wedding_settings" to "authenticated";

grant update on table "public"."wedding_settings" to "authenticated";

grant delete on table "public"."wedding_settings" to "service_role";

grant insert on table "public"."wedding_settings" to "service_role";

grant references on table "public"."wedding_settings" to "service_role";

grant select on table "public"."wedding_settings" to "service_role";

grant trigger on table "public"."wedding_settings" to "service_role";

grant truncate on table "public"."wedding_settings" to "service_role";

grant update on table "public"."wedding_settings" to "service_role";


  create policy "Wedding owners can insert their features"
  on "public"."wedding_features"
  as permissive
  for insert
  to public
with check ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can update their features"
  on "public"."wedding_features"
  as permissive
  for update
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can view their features"
  on "public"."wedding_features"
  as permissive
  for select
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can insert their settings"
  on "public"."wedding_settings"
  as permissive
  for insert
  to public
with check ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can update their settings"
  on "public"."wedding_settings"
  as permissive
  for update
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));



  create policy "Wedding owners can view their settings"
  on "public"."wedding_settings"
  as permissive
  for select
  to public
using ((wedding_id IN ( SELECT weddings.id
   FROM public.weddings
  WHERE (weddings.owner_id = auth.uid()))));


CREATE TRIGGER update_wedding_features_updated_at BEFORE UPDATE ON public.wedding_features FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wedding_settings_updated_at BEFORE UPDATE ON public.wedding_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


