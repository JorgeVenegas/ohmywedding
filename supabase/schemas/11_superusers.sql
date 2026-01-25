-- Superusers table for elevated platform permissions
-- Superusers have full access to all weddings, demo pages, and admin features

create table if not exists "superusers" (
  "id" uuid primary key default gen_random_uuid(),
  "user_id" uuid references auth.users(id) on delete cascade,
  "email" text not null unique,
  "granted_at" timestamptz default now(),
  "granted_by" uuid references auth.users(id),
  "notes" text,
  "is_active" boolean default true,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now()
);

-- Indexes
create index if not exists idx_superusers_email on superusers(email) where is_active = true;
create index if not exists idx_superusers_user_id on superusers(user_id) where is_active = true;

-- RLS
alter table superusers enable row level security;

-- Users can only read their own superuser status (avoids infinite recursion)
create policy "Users can read own superuser status" on superusers
  for select
  using (
    email = lower(auth.jwt() ->> 'email')
    or user_id = auth.uid()
  );

-- Service role has full access (for admin operations)
create policy "Service role full access" on superusers
  for all
  using (true)
  with check (true);

-- Function to check superuser status
create or replace function is_superuser(check_email text default null, check_user_id uuid default null)
returns boolean
language plpgsql
security definer
as $$
begin
  if check_email is not null then
    return exists (select 1 from superusers where email = lower(check_email) and is_active = true);
  end if;
  
  if check_user_id is not null then
    return exists (select 1 from superusers where user_id = check_user_id and is_active = true);
  end if;
  
  return exists (
    select 1 from superusers 
    where (email = lower(auth.jwt() ->> 'email') or user_id = auth.uid())
    and is_active = true
  );
end;
$$;
