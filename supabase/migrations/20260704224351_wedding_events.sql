-- Wedding Events table and User Subscriptions table
-- wedding_events: planning events (deadlines, reminders, logistics)
-- user_subscriptions: tracks user plan subscriptions (free/premium/deluxe)
-- Policies for needs_onboarding, rsvp_otp_verifications, user_subscriptions, wedding_events

create table "public"."user_subscriptions" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "plan_type" text not null default 'free'::text,
  "status" text not null default 'active'::text,
  "started_at" timestamp with time zone not null default now(),
  "expires_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."user_subscriptions" enable row level security;

create table "public"."wedding_events" (
  "id" uuid not null default gen_random_uuid(),
  "wedding_id" uuid not null,
  "title" text not null,
  "description" text,
  "start_date" date,
  "due_date" date not null,
  "completed_at" timestamp with time zone,
  "category" text not null default 'other'::text,
  "status" text not null default 'todo'::text,
  "reminder_days_before" integer not null default 7,
  "assignee_email" text,
  "reviewer_email" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

alter table "public"."wedding_events" enable row level security;

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);
CREATE INDEX idx_wedding_events_due_date ON public.wedding_events USING btree (wedding_id, due_date);
CREATE INDEX idx_wedding_events_wedding ON public.wedding_events USING btree (wedding_id);

CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id);
CREATE UNIQUE INDEX user_subscriptions_user_id_unique ON public.user_subscriptions USING btree (user_id);
CREATE UNIQUE INDEX wedding_events_pkey ON public.wedding_events USING btree (id);

alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" PRIMARY KEY using index "user_subscriptions_pkey";
alter table "public"."wedding_events" add constraint "wedding_events_pkey" PRIMARY KEY using index "wedding_events_pkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_plan_type_check" CHECK ((plan_type = ANY (ARRAY['free'::text, 'premium'::text, 'deluxe'::text]))) not valid;
alter table "public"."user_subscriptions" validate constraint "user_subscriptions_plan_type_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'trial'::text]))) not valid;
alter table "public"."user_subscriptions" validate constraint "user_subscriptions_status_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_unique" UNIQUE using index "user_subscriptions_user_id_unique";

alter table "public"."wedding_events" add constraint "wedding_events_category_check" CHECK ((category = ANY (ARRAY['payment'::text, 'save_the_date'::text, 'invitations'::text, 'communications'::text, 'logistics'::text, 'other'::text]))) not valid;
alter table "public"."wedding_events" validate constraint "wedding_events_category_check";

alter table "public"."wedding_events" add constraint "wedding_events_status_check" CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))) not valid;
alter table "public"."wedding_events" validate constraint "wedding_events_status_check";

alter table "public"."wedding_events" add constraint "wedding_events_wedding_id_fkey" FOREIGN KEY (wedding_id) REFERENCES public.weddings(id) ON DELETE CASCADE not valid;
alter table "public"."wedding_events" validate constraint "wedding_events_wedding_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_plan_features(p_plan_type text)
 RETURNS TABLE(feature_name text, is_available boolean)
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 'rsvp_enabled'::TEXT, (p_plan_type IN ('premium', 'deluxe'))
  UNION ALL
  SELECT 'invitations_panel_enabled'::TEXT, (p_plan_type IN ('premium', 'deluxe'))
  UNION ALL
  SELECT 'gallery_enabled'::TEXT, TRUE
  UNION ALL
  SELECT 'registry_enabled'::TEXT, TRUE
  UNION ALL
  SELECT 'schedule_enabled'::TEXT, TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT plan_type INTO v_plan
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;
  RETURN COALESCE(v_plan, 'free');
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_superuser(check_email text DEFAULT NULL::text, check_user_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if check_email is not null then
    return exists (select 1 from superusers where email = lower(check_email) and is_active = true);
  end if;

  if check_user_id is not null then
    return exists (select 1 from superusers where user_id = check_user_id and is_active = true);
  end if;

  return exists (
    select 1 from superusers
    where (email = lower(auth.jwt() ->> 'email') or user_id = auth.uid())
    and is_active = true
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_registry_item_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item_id uuid;
  v_new_amount numeric;
begin
  if TG_OP = 'DELETE' then
    v_item_id := OLD.custom_registry_item_id;
  else
    v_item_id := NEW.custom_registry_item_id;
  end if;

  select coalesce(sum(amount), 0)
  into v_new_amount
  from registry_contributions
  where custom_registry_item_id = v_item_id
    and payment_status = 'completed';

  update custom_registry_items
  set current_amount = v_new_amount,
      updated_at = now()
  where id = v_item_id;

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_group_open_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  update guest_groups
  set
    first_opened_at = coalesce(first_opened_at, NEW.opened_at),
    open_count = open_count + 1,
    updated_at = now()
  where id = NEW.guest_group_id;

  return NEW;
end;
$function$;

grant delete on table "public"."user_subscriptions" to "anon";
grant insert on table "public"."user_subscriptions" to "anon";
grant references on table "public"."user_subscriptions" to "anon";
grant select on table "public"."user_subscriptions" to "anon";
grant trigger on table "public"."user_subscriptions" to "anon";
grant truncate on table "public"."user_subscriptions" to "anon";
grant update on table "public"."user_subscriptions" to "anon";
grant delete on table "public"."user_subscriptions" to "authenticated";
grant insert on table "public"."user_subscriptions" to "authenticated";
grant references on table "public"."user_subscriptions" to "authenticated";
grant select on table "public"."user_subscriptions" to "authenticated";
grant trigger on table "public"."user_subscriptions" to "authenticated";
grant truncate on table "public"."user_subscriptions" to "authenticated";
grant update on table "public"."user_subscriptions" to "authenticated";
grant delete on table "public"."user_subscriptions" to "service_role";
grant insert on table "public"."user_subscriptions" to "service_role";
grant references on table "public"."user_subscriptions" to "service_role";
grant select on table "public"."user_subscriptions" to "service_role";
grant trigger on table "public"."user_subscriptions" to "service_role";
grant truncate on table "public"."user_subscriptions" to "service_role";
grant update on table "public"."user_subscriptions" to "service_role";

grant delete on table "public"."wedding_events" to "anon";
grant insert on table "public"."wedding_events" to "anon";
grant references on table "public"."wedding_events" to "anon";
grant select on table "public"."wedding_events" to "anon";
grant trigger on table "public"."wedding_events" to "anon";
grant truncate on table "public"."wedding_events" to "anon";
grant update on table "public"."wedding_events" to "anon";
grant delete on table "public"."wedding_events" to "authenticated";
grant insert on table "public"."wedding_events" to "authenticated";
grant references on table "public"."wedding_events" to "authenticated";
grant select on table "public"."wedding_events" to "authenticated";
grant trigger on table "public"."wedding_events" to "authenticated";
grant truncate on table "public"."wedding_events" to "authenticated";
grant update on table "public"."wedding_events" to "authenticated";
grant delete on table "public"."wedding_events" to "service_role";
grant insert on table "public"."wedding_events" to "service_role";
grant references on table "public"."wedding_events" to "service_role";
grant select on table "public"."wedding_events" to "service_role";
grant trigger on table "public"."wedding_events" to "service_role";
grant truncate on table "public"."wedding_events" to "service_role";
grant update on table "public"."wedding_events" to "service_role";

create policy "Users can insert own onboarding"
  on "public"."needs_onboarding"
  as permissive
  for insert
  to public
  with check ((auth.uid() = user_id));

create policy "Allow OTP cleanup"
  on "public"."rsvp_otp_verifications"
  as permissive
  for delete
  to public
  using ((verified = false));

create policy "Service role can manage subscriptions"
  on "public"."user_subscriptions"
  as permissive
  for all
  to public
  using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

create policy "Users can view their own subscription"
  on "public"."user_subscriptions"
  as permissive
  for select
  to public
  using ((user_id = auth.uid()));

create policy "Wedding members can manage events"
  on "public"."wedding_events"
  as permissive
  for all
  to public
  using (((auth.uid() IS NOT NULL) AND (wedding_id IN ( SELECT weddings.id
     FROM public.weddings
    WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR ((auth.jwt() ->> 'email'::text) = ANY (weddings.collaborator_emails)))))))
  with check (((auth.uid() IS NOT NULL) AND (wedding_id IN ( SELECT weddings.id
     FROM public.weddings
    WHERE ((weddings.owner_id = auth.uid()) OR (weddings.owner_id IS NULL) OR ((auth.jwt() ->> 'email'::text) = ANY (weddings.collaborator_emails)))))));

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wedding_events_updated_at BEFORE UPDATE ON public.wedding_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
