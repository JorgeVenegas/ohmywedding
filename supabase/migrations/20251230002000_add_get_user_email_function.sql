-- Create a security definer function to get current user's email
-- This is needed because RLS policies can't directly access auth.users

CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid();
$$;
