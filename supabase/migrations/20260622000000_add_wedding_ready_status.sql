-- Add wedding ready status fields to weddings table
ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ready_status_managed_by TEXT NOT NULL DEFAULT 'owner';

-- Add check constraint for valid values
ALTER TABLE weddings
  ADD CONSTRAINT weddings_ready_status_managed_by_check
  CHECK (ready_status_managed_by IN ('owner', 'all'));

-- Index for quick lookup when checking is_ready in tracking routes
CREATE INDEX IF NOT EXISTS weddings_is_ready_idx ON weddings (id, is_ready);
