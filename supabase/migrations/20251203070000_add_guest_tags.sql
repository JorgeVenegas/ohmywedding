-- Add tags column to guests table
alter table "public"."guests" add column if not exists "tags" text[] default '{}';
