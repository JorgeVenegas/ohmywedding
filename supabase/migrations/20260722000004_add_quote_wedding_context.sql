-- Add optional wedding context fields to quotes for better lead tracking
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS wedding_date     TEXT,
  ADD COLUMN IF NOT EXISTS estimated_guests INTEGER,
  ADD COLUMN IF NOT EXISTS location         TEXT;
