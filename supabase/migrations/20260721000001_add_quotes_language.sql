ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'es'
    CHECK (language IN ('en', 'es'));
