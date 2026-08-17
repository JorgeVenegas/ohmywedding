-- Add activity_reports config to wedding_settings
-- and a timestamp to track when the last report was sent.

ALTER TABLE wedding_settings
  ADD COLUMN IF NOT EXISTS activity_reports jsonb NOT NULL DEFAULT '{
    "enabled": false,
    "frequency": "weekly",
    "include_rsvp": true,
    "include_meetings": true,
    "include_budget": true,
    "include_messages": true,
    "additional_emails": []
  }'::jsonb;

ALTER TABLE wedding_settings
  ADD COLUMN IF NOT EXISTS last_activity_report_sent_at timestamptz DEFAULT NULL;
