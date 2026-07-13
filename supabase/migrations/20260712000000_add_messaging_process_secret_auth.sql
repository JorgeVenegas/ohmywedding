-- Fix: neither the instant-push trigger nor the pg_cron sweep sends an Authorization
-- header when calling /api/messaging/process, so if MESSAGING_PROCESS_SECRET is set
-- on the app deployment, every trigger-initiated call 401s and the queue never drains
-- automatically (manual curls without the header fail the same way). Store the
-- matching secret in app_config (same mechanism as messaging_process_url) and send it
-- as a Bearer token when present.

create or replace function public.handle_new_webhook_event()
returns trigger
language plpgsql
security definer
set search_path = public, pgmq, extensions
as $$
declare
  v_process_url text;
  v_process_secret text;
  v_headers jsonb;
begin
  perform pgmq.send('whatsapp_inbound', jsonb_build_object('webhook_event_id', new.id));

  select value into v_process_url from app_config where key = 'messaging_process_url';
  select value into v_process_secret from app_config where key = 'messaging_process_secret';

  if v_process_url is not null and v_process_url <> '' then
    v_headers := jsonb_build_object('Content-Type', 'application/json');
    if v_process_secret is not null and v_process_secret <> '' then
      v_headers := v_headers || jsonb_build_object('Authorization', 'Bearer ' || v_process_secret);
    end if;

    perform net.http_post(
      url := v_process_url,
      headers := v_headers,
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
  v_process_secret text;
  v_headers jsonb;
begin
  select value into v_process_url from app_config where key = 'messaging_process_url';
  select value into v_process_secret from app_config where key = 'messaging_process_secret';

  if v_process_url is not null and v_process_url <> '' then
    v_headers := jsonb_build_object('Content-Type', 'application/json');
    if v_process_secret is not null and v_process_secret <> '' then
      v_headers := v_headers || jsonb_build_object('Authorization', 'Bearer ' || v_process_secret);
    end if;

    perform net.http_post(
      url := v_process_url,
      headers := v_headers,
      body := '{}'::jsonb
    );
  end if;
end;
$$;
