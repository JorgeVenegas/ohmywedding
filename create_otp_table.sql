-- Create OTP verification table
CREATE TABLE IF NOT EXISTS public.rsvp_otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_group_id uuid NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  verified boolean DEFAULT false,
  verification_token text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_otp_phone_group ON rsvp_otp_verifications (guest_group_id, phone_number) WHERE verified = false;
CREATE INDEX IF NOT EXISTS idx_otp_token ON rsvp_otp_verifications (verification_token) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_otp_expiry ON rsvp_otp_verifications (expires_at) WHERE verified = false;

-- Enable RLS
ALTER TABLE rsvp_otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can request OTP verification" ON rsvp_otp_verifications;
CREATE POLICY "Anyone can request OTP verification"
  ON rsvp_otp_verifications
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read their verification status" ON rsvp_otp_verifications;
CREATE POLICY "Users can read their verification status"
  ON rsvp_otp_verifications
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow verification updates" ON rsvp_otp_verifications;
CREATE POLICY "Allow verification updates"
  ON rsvp_otp_verifications
  FOR UPDATE
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow deletion of verifications" ON rsvp_otp_verifications;
CREATE POLICY "Allow deletion of verifications"
  ON rsvp_otp_verifications
  FOR DELETE
  TO public
  USING (true);
