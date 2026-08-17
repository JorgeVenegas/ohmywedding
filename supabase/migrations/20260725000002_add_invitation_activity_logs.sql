-- Activity log for invitation design events visible to clients and superadmin
CREATE TABLE IF NOT EXISTS invitation_activity_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id   UUID        NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL, -- meeting_scheduled, meeting_rescheduled, meeting_cancelled, meeting_deleted, meeting_created, meeting_updated
  title        TEXT        NOT NULL,
  description  TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitation_activity_logs_wedding
  ON invitation_activity_logs (wedding_id, created_at DESC);

-- Owners and collaborators can read their own wedding logs; superadmins can read all
ALTER TABLE invitation_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_logs" ON invitation_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = wedding_id
        AND (
          w.owner_id = auth.uid()
          OR (auth.jwt() ->> 'email') = ANY(w.collaborator_emails)
        )
    )
  );

CREATE POLICY "service_role_all" ON invitation_activity_logs
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
