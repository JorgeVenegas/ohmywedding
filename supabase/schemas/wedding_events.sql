-- Wedding Events: logistics and planning timeline for the couple
-- Used to track key dates (save-the-dates, invitation sends, reminders, etc.)
-- Supplier payments appear on the same timeline but live in supplier_payments

create table "wedding_events" (
  "id"                   uuid primary key default gen_random_uuid(),
  "wedding_id"           uuid not null references weddings(id) on delete cascade,
  "title"                text not null,
  "description"          text,
  "start_date"           date,
  "due_date"             date not null,
  "completed_at"         timestamp with time zone,
  "category"             text not null default 'other'
                           check (category in (
                             'payment','save_the_date','invitations',
                             'communications','logistics','other'
                           )),
  "status"               text not null default 'todo'
                           check (status in ('todo','in_progress','completed','cancelled')),
  "reminder_days_before" integer not null default 7,
  "assignee_email"       text,
  "reviewer_email"       text,
  "created_at"           timestamp with time zone default now(),
  "updated_at"           timestamp with time zone default now()
);

create index "idx_wedding_events_wedding" on wedding_events (wedding_id);
create index "idx_wedding_events_due_date" on wedding_events (wedding_id, due_date);

alter table "wedding_events" enable row level security;

create policy "Wedding members can manage events"
  on wedding_events
  for all
  using (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  )
  with check (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  );

create trigger "update_wedding_events_updated_at"
  before update on wedding_events
  for each row
  execute function update_updated_at_column();
