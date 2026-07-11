-- Fix: idx_messages_channel_message_id was a partial unique index
-- (`where channel_message_id is not null`), which Postgres cannot use as an
-- ON CONFLICT arbiter target unless the conflict clause repeats the same WHERE
-- predicate — something supabase-js's .upsert({ onConflict: 'channel_message_id' })
-- has no way to express, producing 42P10 "no unique or exclusion constraint
-- matching the ON CONFLICT specification" (caught during end-to-end verification).
--
-- A plain (non-partial) unique constraint gives the same practical behavior here:
-- Postgres already treats every NULL as distinct from every other NULL under a
-- unique constraint, so multiple messages with channel_message_id = NULL remain
-- allowed without the partial predicate.

drop index if exists "idx_messages_channel_message_id";

alter table "messages"
  add constraint "messages_channel_message_id_key" unique ("channel_message_id");
