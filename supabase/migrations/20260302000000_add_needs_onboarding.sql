-- Table to track users who need onboarding tutorial
-- A record exists = user needs onboarding; deleted on completion
create table if not exists "needs_onboarding" (
  "user_id" uuid primary key references auth.users(id) on delete cascade,
  "created_at" timestamp with time zone default now()
);

-- RLS policies
alter table "needs_onboarding" enable row level security;

-- Users can read their own onboarding status
create policy "Users can read own onboarding status"
  on "needs_onboarding"
  for select
  using (auth.uid() = user_id);

-- Users can delete their own onboarding record (mark as completed)
create policy "Users can complete own onboarding"
  on "needs_onboarding"
  for delete
  using (auth.uid() = user_id);

-- Only service role or triggers can insert (done via API on wedding creation)
-- No INSERT policy for regular users - insertion happens server-side
create policy "Service role can insert onboarding"
  on "needs_onboarding"
  for insert
  with check (auth.uid() = user_id);
