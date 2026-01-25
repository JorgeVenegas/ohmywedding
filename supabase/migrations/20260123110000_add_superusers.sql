-- Create superusers table to track users with elevated permissions
CREATE TABLE IF NOT EXISTS superusers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_superusers_email ON superusers(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_superusers_user_id ON superusers(user_id) WHERE is_active = true;

-- RLS policies for superusers table
ALTER TABLE superusers ENABLE ROW LEVEL SECURITY;

-- Only superusers can read the superusers table
CREATE POLICY "Superusers can read superusers table" ON superusers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM superusers s 
      WHERE s.email = auth.jwt() ->> 'email' 
      AND s.is_active = true
    )
    OR auth.uid() IN (SELECT user_id FROM superusers WHERE is_active = true)
  );

-- Only service role can insert/update/delete superusers (manual admin operation)
CREATE POLICY "Service role can manage superusers" ON superusers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create a function to check if a user is a superuser
CREATE OR REPLACE FUNCTION is_superuser(check_email text DEFAULT NULL, check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check by email if provided
  IF check_email IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM superusers 
      WHERE email = lower(check_email) 
      AND is_active = true
    );
  END IF;
  
  -- Check by user_id if provided
  IF check_user_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM superusers 
      WHERE user_id = check_user_id 
      AND is_active = true
    );
  END IF;
  
  -- Check current authenticated user
  RETURN EXISTS (
    SELECT 1 FROM superusers 
    WHERE (
      email = lower(auth.jwt() ->> 'email')
      OR user_id = auth.uid()
    )
    AND is_active = true
  );
END;
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION is_superuser TO authenticated;
GRANT EXECUTE ON FUNCTION is_superuser TO anon;

-- Comment for documentation
COMMENT ON TABLE superusers IS 'Table to track superusers with elevated permissions across the platform';
COMMENT ON FUNCTION is_superuser IS 'Check if a user (by email, user_id, or current session) is a superuser';
