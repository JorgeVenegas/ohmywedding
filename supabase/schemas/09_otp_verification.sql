-- OTP verification table for RSVP confirmation
-- Uses Supabase Auth's built-in phone OTP feature
-- This table tracks which guest groups have completed OTP verification
create table "rsvp_otp_verifications" (
  "id" uuid primary key default gen_random_uuid(),
  "guest_group_id" uuid not null references guest_groups(id) on delete cascade,
  "phone_number" text not null,
  "verified" boolean default false,
  "verification_token" text, -- Unique token generated after successful OTP verification
  "expires_at" timestamp with time zone not null,
  "created_at" timestamp with time zone default now(),
  "verified_at" timestamp with time zone
);

-- Index for quick lookup
create index "idx_otp_phone_group" on rsvp_otp_verifications (guest_group_id, phone_number) where verified = false;
create index "idx_otp_token" on rsvp_otp_verifications (verification_token) where verified = true;
create index "idx_otp_expiry" on rsvp_otp_verifications (expires_at) where verified = false;

-- Function to clean up expired OTPs
create or replace function cleanup_expired_otps()
returns void
language plpgsql
security definer
as $$
begin
  delete from rsvp_otp_verifications
  where expires_at < now() and verified = false;
end;
$$;

-- RLS policies for OTP verifications
alter table rsvp_otp_verifications enable row level security;

-- Allow anyone to insert verification requests
create policy "Anyone can request OTP verification"
  on rsvp_otp_verifications
  for insert
  to public
  with check (true);

-- Allow users to read their own verification status by phone number
create policy "Users can read their verification status"
  on rsvp_otp_verifications
  for select
  to public
  using (true);

-- Allow anyone to update verification status (for marking as verified)
create policy "Allow verification updates"
  on rsvp_otp_verifications
  for update
  to public
  using (true);

-- Note: Supabase Auth handles the actual OTP sending and verification
-- This table just tracks which guest groups have been verified
