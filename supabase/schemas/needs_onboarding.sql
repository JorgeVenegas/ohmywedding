-- Needs onboarding table - tracks users who haven't completed the tutorial
-- Record exists = needs onboarding, deleted on completion
create table if not exists "needs_onboarding" (
  "user_id" uuid primary key references auth.users(id) on delete cascade,
  "created_at" timestamp with time zone default now()
);

alter table "needs_onboarding" enable row level security;

create policy "Users can read own onboarding status"
  on "needs_onboarding" for select using (auth.uid() = user_id);

create policy "Users can complete own onboarding"
  on "needs_onboarding" for delete using (auth.uid() = user_id);

create policy "Users can insert own onboarding"
  on "needs_onboarding" for insert with check (auth.uid() = user_id);
