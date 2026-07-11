-- Messaging platform (WhatsApp first, channel-agnostic by design)
-- See docs/whatsapp-integration-design.md for the full architecture rationale.
--
-- Security model: every table below is wedding-scoped and RLS-enabled. Unlike most
-- other tables in this schema, messaging write policies for authenticated users are
-- deliberately narrow (read-only, or absent entirely) — inserts/updates to
-- whatsapp_accounts, contacts, conversations, messages, message_events and
-- webhook_events all happen server-side via the service-role client. This prevents a
-- client bug or compromised session from forging delivery statuses or injecting
-- messages into another wedding's conversation. message_templates is the one
-- exception (hosts manage their own templates directly).
--
-- Also deliberately omitted here: the "owner_id is null" public-claim clause used
-- elsewhere in this schema (e.g. guests, guest_groups) for unclaimed/demo weddings.
-- Guest phone numbers and message content must never be readable on an unclaimed or
-- demo wedding.
--
-- Table order below follows foreign-key dependency order, not the conceptual order
-- used in the design doc (webhook_events and message_templates are created early
-- because messages/message_events reference them).

-- Channels: static registry of supported channel types and their capabilities.
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

-- Webhook events: raw, immutable record of every inbound webhook call, independent of
-- whether it was successfully processed. The audit/replay backbone (design doc §4).
-- Deliberately has NO select/insert/update policy at all for authenticated/anon —
-- contains raw guest PII and is service-role-only, full stop.
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

-- WhatsApp accounts: a wedding's connected WhatsApp Business phone number + credentials.
create table "whatsapp_accounts" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "channel_id" uuid not null references channels(id),
  "waba_id" text not null,
  "phone_number_id" text not null unique,
  "display_phone_number" text not null,
  "display_name" text,
  "access_token_secret" text, -- plaintext for now; production needs Supabase Vault (see design doc §9.2)
  "app_secret" text, -- used to verify inbound webhook signatures for this account
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

-- Contacts: channel identity, decoupled from guests (see design doc §2.3).
create table "contacts" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_id" uuid references guests(id) on delete set null,
  "channel_id" uuid not null references channels(id),
  "external_address" text not null, -- E.164 phone for WhatsApp/SMS, email address for Email
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

-- Conversations: the thread. One per (wedding, contact, channel) — the inbox's list entity.
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
  "session_expires_at" timestamp with time zone, -- WhatsApp 24h customer-service-window tracker
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

-- Message templates: pre-approved (WhatsApp) or reusable message templates.
-- Unlike most tables above, hosts manage these directly.
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

-- Messages: every inbound/outbound unit of communication. Highest-volume table here.
create table "messages" (
  "id" uuid primary key default gen_random_uuid(),
  "conversation_id" uuid not null references conversations(id) on delete cascade,
  "wedding_id" uuid not null references weddings(id) on delete cascade, -- denormalized so RLS never needs a join
  "direction" text not null check ("direction" in ('inbound', 'outbound')),
  "sender_type" text not null check ("sender_type" in ('guest', 'host', 'system', 'ai')),
  "sender_user_id" uuid references auth.users(id) on delete set null,
  "body" text,
  "message_type" text not null default 'text'
    check ("message_type" in ('text', 'template', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'unsupported')),
  "template_id" uuid references message_templates(id) on delete set null,
  -- Plain (non-partial) unique constraint, not a partial index: Postgres can't use
  -- a partial unique index as an ON CONFLICT arbiter unless the conflict clause
  -- repeats its WHERE predicate, which supabase-js's upsert() can't express. NULLs
  -- are already distinct from each other under a plain unique constraint, so this
  -- gives the same "dedupe non-null values only" behavior without that problem.
  "channel_message_id" text unique, -- provider's message id (Meta's wamid)
  "status" text not null default 'pending'
    check ("status" in ('pending', 'sent', 'delivered', 'read', 'failed')),
  "error_code" text,
  "error_message" text,
  "context_message_id" uuid references messages(id),
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

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

-- Message events: append-only, immutable delivery/read/failed audit trail.
-- messages.status is a denormalization of the latest event here — never last-write-wins,
-- always highest-rank-wins (failed/read are terminal-ish; a late 'sent' never downgrades
-- a 'delivered'/'read' status). See design doc §3.6.
create table "message_events" (
  "id" uuid primary key default gen_random_uuid(),
  "message_id" uuid not null references messages(id) on delete cascade,
  "event_type" text not null
    check ("event_type" in ('queued', 'sent', 'delivered', 'read', 'failed', 'deleted')),
  "occurred_at" timestamp with time zone not null, -- provider-reported time, not insert time
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

-- Attachments: media metadata + Storage pointer for message media (Phase 2 wires the
-- actual upload/download flow; the table is added now so the schema doesn't need to
-- change shape later).
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

-- App config: small key/value table used by the messaging queue's dispatch
-- functions (see migration) to look up the deployed processing endpoint URL per
-- environment. Postgres custom GUCs via `alter database ... set` need superuser,
-- which Supabase's `postgres` role does not have — a table is the portable option.
-- Service-role only, same posture as webhook_events.
create table "app_config" (
  "key" text primary key,
  "value" text
);

alter table "app_config" enable row level security;
