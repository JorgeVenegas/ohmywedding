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

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);

CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id);

CREATE UNIQUE INDEX user_subscriptions_user_id_unique ON public.user_subscriptions USING btree (user_id);

alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" PRIMARY KEY using index "user_subscriptions_pkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_plan_type_check" CHECK ((plan_type = ANY (ARRAY['free'::text, 'premium'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_plan_type_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'trial'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_status_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_unique" UNIQUE using index "user_subscriptions_user_id_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_plan_features(p_plan_type text)
 RETURNS TABLE(feature_name text, is_available boolean)
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 'rsvp_enabled'::TEXT, (p_plan_type = 'premium')
  UNION ALL
  SELECT 'invitations_panel_enabled'::TEXT, (p_plan_type = 'premium')
  UNION ALL
  SELECT 'gallery_enabled'::TEXT, TRUE -- Always available
  UNION ALL
  SELECT 'registry_enabled'::TEXT, TRUE -- Always available
  UNION ALL
  SELECT 'schedule_enabled'::TEXT, TRUE; -- Always available
END;
$function$
;

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
  
  -- Default to free if no subscription found
  RETURN COALESCE(v_plan, 'free');
END;
$function$
;

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


CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


