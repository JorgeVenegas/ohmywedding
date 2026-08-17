-- Store the Google Calendar event ID so we can update/cancel events later.
ALTER TABLE design_meetings
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;
