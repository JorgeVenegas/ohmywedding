-- 1. Add dedicated Cal.com booking fields to design_meetings
--    (previously the uid was crammed into the notes column)
ALTER TABLE design_meetings
  ADD COLUMN IF NOT EXISTS calcom_uid TEXT,
  ADD COLUMN IF NOT EXISTS calcom_event_type_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_design_meetings_calcom_uid
  ON design_meetings (calcom_uid) WHERE calcom_uid IS NOT NULL;

-- Backfill: rows where notes looks like a Cal.com uid (no spaces, short-ish) get migrated
-- This is best-effort; after deploy the webhook will use calcom_uid going forward.
UPDATE design_meetings
  SET calcom_uid = notes, notes = NULL
  WHERE notes IS NOT NULL
    AND notes NOT LIKE '% %'
    AND char_length(notes) BETWEEN 8 AND 64
    AND notes ~ '^[a-zA-Z0-9_\-]+$';

-- Expand meeting_type to include 'demo' for consultation bookings attached to a wedding
ALTER TABLE design_meetings
  DROP CONSTRAINT IF EXISTS design_meetings_meeting_type_check;

ALTER TABLE design_meetings
  ADD CONSTRAINT design_meetings_meeting_type_check
  CHECK (meeting_type IN ('kickoff', 'review', 'final', 'demo', 'other'));

-- 2. Demo bookings — consultation calls from the landing pages (no wedding yet)
CREATE TABLE IF NOT EXISTS demo_bookings (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  calcom_uid            TEXT        UNIQUE,
  calcom_event_type_slug TEXT,
  title                 TEXT        NOT NULL,
  attendee_name         TEXT,
  attendee_email        TEXT,
  notes                 TEXT,
  scheduled_at          TIMESTAMPTZ,
  meeting_url           TEXT,
  status                TEXT        NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'rescheduled')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_bookings_scheduled_at
  ON demo_bookings (scheduled_at DESC);

ALTER TABLE demo_bookings ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read/write demo bookings
DROP POLICY IF EXISTS "Superadmins manage demo bookings" ON demo_bookings;
CREATE POLICY "Superadmins manage demo bookings" ON demo_bookings
  USING (
    EXISTS (SELECT 1 FROM superusers WHERE user_id = auth.uid())
  );
