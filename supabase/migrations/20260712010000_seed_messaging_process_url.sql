-- Seeds the messaging_process_url app_config row so the instant-push trigger and
-- the pg_cron sweep (see 20260708031500 and 20260712000000) actually fire. Not
-- sensitive (just the app's own prod URL), so safe to commit — unlike
-- messaging_process_secret, which is set out-of-band via the SQL editor to avoid
-- putting a secret value in git history.

insert into app_config (key, value) values
  ('messaging_process_url', 'https://www.ohmy.wedding/api/messaging/process')
on conflict (key) do update set value = excluded.value;
