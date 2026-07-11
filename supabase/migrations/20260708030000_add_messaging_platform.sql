-- WhatsApp / messaging platform: extensions, tables, RLS, queue, and dispatch trigger.
-- Mirrors supabase/schemas/messaging.sql (kept as the declarative source of truth;
-- this migration is hand-authored to actually apply it — see docs/whatsapp-integration-design.md).

-- ============================================================================
-- Extensions
-- ============================================================================
-- pg_net is already enabled in this project (20251230015327_add_otp_verification.sql).
create extension if not exists "pgmq";
create extension if not exists "pg_cron";

-- pgmq's install script leaves search_path pointed at its own schema; reset it so the
-- unqualified `create table` statements below land in public as intended.
set search_path = public;

-- ============================================================================
-- Tables (order follows FK dependency order)
-- ============================================================================

create table "channels" (
  "id" uuid primary key default gen_random_uuid(),
  "type" text not null unique check ("type" in ('whatsapp', 'email', 'sms')),
  "display_name" text not null,
  "capabilities" jsonb not null default '{}'::jsonb,
  "is_enabled" boolean not null default true,
  "created_at" timestamp with time zone not null default now()
);

alter table "channels" enable row level security;

create policy "Authenticated users can view channels" on channels
  for select to authenticated using (true);

insert into "channels" ("type", "display_name", "capabilities", "is_enabled") values
  ('whatsapp', 'WhatsApp', '{"supports_templates": true, "supports_media": true, "requires_session_window": true}'::jsonb, true),
  ('email', 'Email', '{"supports_templates": true, "supports_media": true, "requires_session_window": false}'::jsonb, false),
  ('sms', 'SMS', '{"supports_templates": false, "supports_media": false, "requires_session_window": false}'::jsonb, false)
on conflict ("type") do nothing;

create table "webhook_events" (
  "id" uuid primary key default gen_random_uuid(),
  "provider" text not null check ("provider" in ('whatsapp', 'email', 'sms')),
  "provider_event_id" text not null,
  "signature_verified" boolean not null,
  "raw_payload" jsonb not null,
  "status" text not null default 'pending'
    check ("status" in ('pending', 'processing', 'processed', 'failed', 'ignored')),
  "attempt_count" integer not null default 0,
  "last_error" text,
  "received_at" timestamp with time zone not null default now(),
  "processed_at" timestamp with time zone,

  constraint "webhook_events_provider_event_unique" unique ("provider", "provider_event_id")
);

create index "idx_webhook_events_status" on webhook_events (status, received_at) where status in ('pending', 'processing');
create index "idx_webhook_events_received_at" on webhook_events (received_at);

alter table "webhook_events" enable row level security;

create table "whatsapp_accounts" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "channel_id" uuid not null references channels(id),
  "waba_id" text not null,
  "phone_number_id" text not null unique,
  "display_phone_number" text not null,
  "display_name" text,
  "access_token_secret" text,
  "app_secret" text,
  "token_expires_at" timestamp with time zone,
  "status" text not null default 'pending'
    check ("status" in ('pending', 'connected', 'disconnected', 'error')),
  "quality_rating" text,
  "messaging_limit_tier" text,
  "connected_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),

  constraint "whatsapp_accounts_wedding_channel_unique" unique ("wedding_id", "channel_id", "phone_number_id")
);

create index "idx_whatsapp_accounts_wedding_id" on whatsapp_accounts (wedding_id);

create trigger "update_whatsapp_accounts_updated_at"
  before update on whatsapp_accounts
  for each row
  execute function update_updated_at_column();

alter table "whatsapp_accounts" enable row level security;

create policy "Owners and collaborators can view whatsapp accounts" on whatsapp_accounts
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create table "contacts" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_id" uuid references guests(id) on delete set null,
  "channel_id" uuid not null references channels(id),
  "external_address" text not null,
  "display_name" text,
  "metadata" jsonb not null default '{}'::jsonb,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),

  constraint "contacts_wedding_channel_address_unique" unique ("wedding_id", "channel_id", "external_address")
);

create index "idx_contacts_wedding_id" on contacts (wedding_id);
create index "idx_contacts_guest_id" on contacts (guest_id) where guest_id is not null;

create trigger "update_contacts_updated_at"
  before update on contacts
  for each row
  execute function update_updated_at_column();

alter table "contacts" enable row level security;

create policy "Owners and collaborators can view contacts" on contacts
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create table "conversations" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "contact_id" uuid not null references contacts(id) on delete cascade,
  "channel_id" uuid not null references channels(id),
  "channel_account_id" uuid references whatsapp_accounts(id),
  "status" text not null default 'open'
    check ("status" in ('open', 'snoozed', 'closed')),
  "assigned_to" uuid references auth.users(id) on delete set null,
  "unread_count" integer not null default 0 check ("unread_count" >= 0),
  "last_message_at" timestamp with time zone,
  "last_message_preview" text,
  "session_expires_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),

  constraint "conversations_wedding_contact_channel_unique" unique ("wedding_id", "contact_id", "channel_id")
);

create index "idx_conversations_wedding_list" on conversations (wedding_id, last_message_at desc);
create index "idx_conversations_wedding_status" on conversations (wedding_id, status) where status = 'open';

create trigger "update_conversations_updated_at"
  before update on conversations
  for each row
  execute function update_updated_at_column();

alter table "conversations" enable row level security;

create policy "Owners and collaborators can view conversations" on conversations
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create table "message_templates" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "channel_id" uuid not null references channels(id),
  "name" text not null,
  "language" text not null default 'en_US',
  "category" text check ("category" in ('marketing', 'utility', 'authentication')),
  "body_text" text not null,
  "variables_schema" jsonb not null default '[]'::jsonb,
  "provider_template_id" text,
  "approval_status" text not null default 'draft'
    check ("approval_status" in ('draft', 'pending_review', 'approved', 'rejected', 'disabled')),
  "rejection_reason" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),

  constraint "message_templates_wedding_channel_name_lang_unique" unique ("wedding_id", "channel_id", "name", "language")
);

create index "idx_message_templates_wedding_id" on message_templates (wedding_id);
create index "idx_message_templates_approved" on message_templates (wedding_id, channel_id) where approval_status = 'approved';

create trigger "update_message_templates_updated_at"
  before update on message_templates
  for each row
  execute function update_updated_at_column();

alter table "message_templates" enable row level security;

create policy "Owners and collaborators can view templates" on message_templates
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Owners and collaborators can manage templates" on message_templates
  for all using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create table "messages" (
  "id" uuid primary key default gen_random_uuid(),
  "conversation_id" uuid not null references conversations(id) on delete cascade,
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "direction" text not null check ("direction" in ('inbound', 'outbound')),
  "sender_type" text not null check ("sender_type" in ('guest', 'host', 'system', 'ai')),
  "sender_user_id" uuid references auth.users(id) on delete set null,
  "body" text,
  "message_type" text not null default 'text'
    check ("message_type" in ('text', 'template', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'unsupported')),
  "template_id" uuid references message_templates(id) on delete set null,
  "channel_message_id" text,
  "status" text not null default 'pending'
    check ("status" in ('pending', 'sent', 'delivered', 'read', 'failed')),
  "error_code" text,
  "error_message" text,
  "context_message_id" uuid references messages(id),
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

create unique index "idx_messages_channel_message_id" on messages (channel_message_id) where channel_message_id is not null;
create index "idx_messages_conversation_created" on messages (conversation_id, created_at);
create index "idx_messages_wedding_id" on messages (wedding_id);

create trigger "update_messages_updated_at"
  before update on messages
  for each row
  execute function update_updated_at_column();

alter table "messages" enable row level security;

create policy "Owners and collaborators can view messages" on messages
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create table "message_events" (
  "id" uuid primary key default gen_random_uuid(),
  "message_id" uuid not null references messages(id) on delete cascade,
  "event_type" text not null
    check ("event_type" in ('queued', 'sent', 'delivered', 'read', 'failed', 'deleted')),
  "occurred_at" timestamp with time zone not null,
  "error_code" text,
  "error_message" text,
  "raw_payload" jsonb,
  "webhook_event_id" uuid references webhook_events(id) on delete set null,
  "created_at" timestamp with time zone not null default now()
);

create index "idx_message_events_message_id" on message_events (message_id, occurred_at);

alter table "message_events" enable row level security;

create policy "Owners and collaborators can view message events" on message_events
  for select using (
    message_id in (
      select id from messages where wedding_id in (
        select id from weddings where owner_id = auth.uid()
        or auth.jwt()->>'email' = any(collaborator_emails)
      )
    )
  );

create table "attachments" (
  "id" uuid primary key default gen_random_uuid(),
  "message_id" uuid not null references messages(id) on delete cascade,
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "kind" text not null check ("kind" in ('image', 'video', 'audio', 'document', 'sticker')),
  "provider_media_id" text,
  "storage_bucket" text not null default 'message-attachments',
  "storage_path" text,
  "mime_type" text,
  "file_size_bytes" bigint,
  "sha256" text,
  "download_status" text not null default 'pending'
    check ("download_status" in ('pending', 'downloaded', 'failed', 'expired')),
  "created_at" timestamp with time zone not null default now()
);

create index "idx_attachments_message_id" on attachments (message_id);
create index "idx_attachments_wedding_pending" on attachments (wedding_id) where download_status = 'pending';

alter table "attachments" enable row level security;

create policy "Owners and collaborators can view attachments" on attachments
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

-- ============================================================================
-- Realtime — required for the inbox UI's live conversation/message updates
-- ============================================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;

-- ============================================================================
-- Queue (pgmq) — durability layer for inbound webhook processing
-- ============================================================================
do $$
begin
  perform pgmq.create('whatsapp_inbound');
exception when duplicate_table then
  null;
end $$;

-- Wrapper functions so the Next.js service-role client can drive the queue via
-- .rpc() without needing direct grants on the pgmq schema's internals.
create or replace function public.messaging_queue_read(p_qty integer default 10, p_vt integer default 30)
returns table(msg_id bigint, read_ct integer, enqueued_at timestamptz, vt timestamptz, message jsonb)
language sql
security definer
set search_path = public, pgmq
as $$
  select msg_id, read_ct, enqueued_at, vt, message
  from pgmq.read('whatsapp_inbound', p_vt, p_qty);
$$;

create or replace function public.messaging_queue_ack(p_msg_id bigint)
returns boolean
language sql
security definer
set search_path = public, pgmq
as $$
  select pgmq.archive('whatsapp_inbound', p_msg_id);
$$;

revoke all on function public.messaging_queue_read(integer, integer) from public, anon, authenticated;
grant execute on function public.messaging_queue_read(integer, integer) to service_role;

revoke all on function public.messaging_queue_ack(bigint) from public, anon, authenticated;
grant execute on function public.messaging_queue_ack(bigint) to service_role;

-- ============================================================================
-- Push dispatch — instant processing on new webhook_events, not poll-based
-- (see docs/whatsapp-integration-design.md §4/§5 latency budget)
-- ============================================================================
-- The processing endpoint URL is read from a Postgres setting rather than hardcoded,
-- so the same migration works unchanged across local/preview/prod. It is intentionally
-- NOT set here — set it once per environment with:
--   alter database postgres set app.messaging_process_url = 'https://<host>/api/messaging/process';
-- If unset, the trigger and the cron sweep below both no-op silently (never error),
-- and messages simply wait for manual/cron processing instead of instant push.
create or replace function public.handle_new_webhook_event()
returns trigger
language plpgsql
security definer
set search_path = public, pgmq, extensions
as $$
declare
  v_process_url text := current_setting('app.messaging_process_url', true);
begin
  perform pgmq.send('whatsapp_inbound', jsonb_build_object('webhook_event_id', new.id));

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

create trigger "on_webhook_event_created"
  after insert on webhook_events
  for each row
  execute function public.handle_new_webhook_event();

-- ============================================================================
-- Safety-net sweep — pg_cron, not Vercel Cron (unaffected by Vercel plan-tier
-- cron-frequency limits). Only catches what the instant push above missed.
-- ============================================================================
create or replace function public.messaging_queue_sweep_dispatch()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_process_url text := current_setting('app.messaging_process_url', true);
begin
  if v_process_url is not null and v_process_url <> '' then
    perform net.http_post(
      url := v_process_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  end if;
end;
$$;

select cron.schedule('messaging-queue-sweep', '* * * * *', 'select public.messaging_queue_sweep_dispatch();');
