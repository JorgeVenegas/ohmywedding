-- Add a superuser to the database
-- Run this with: supabase db execute --local -f scripts/add-superuser.sql
-- Or use Supabase Studio at http://127.0.0.1:54323

-- Replace 'your-email@example.com' with your actual email
INSERT INTO superusers (email, notes)
VALUES ('your-email@example.com', 'Platform owner - initial superuser')
ON CONFLICT (email) DO UPDATE SET is_active = true, updated_at = now();

-- Verify the superuser was added
SELECT * FROM superusers;
