-- Fix: the previous migration used `current_setting('app.messaging_process_url')`,
-- set via `alter database ... set`. That requires superuser, which Supabase's
-- `postgres` role does not have on either local or hosted projects (confirmed via
-- `select current_setting('is_superuser')` -> off). Replace with a small config
-- table instead, read by the same two dispatch functions, updatable without any
-- special privileges (and eventually from an admin settings UI, not just SQL).

create table "app_config" (
  "key" text primary key,
  "value" text
);

alter table "app_config" enable row level security;
-- No policies: service-role only, matching webhook_events.

create or replace function public.handle_new_webhook_event()
returns trigger
language plpgsql
security definer
set search_path = public, pgmq, extensions
as $$
declare
  v_process_url text;
begin
  perform pgmq.send('whatsapp_inbound', jsonb_build_object('webhook_event_id', new.id));

  select value into v_process_url from app_config where key = 'messaging_process_url';

  if v_process_url is not null and v_process_url <> '' then
    perform net.http_post(
      url := v_process_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('webhook_event_id', new.id)
    );
  end if;

  return new;
end;
$$;

create or replace function public.messaging_queue_sweep_dispatch()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_process_url text;
begin
  select value into v_process_url from app_config where key = 'messaging_process_url';

  if v_process_url is not null and v_process_url <> '' then
    perform net.http_post(
      url := v_process_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  end if;
end;
$$;
