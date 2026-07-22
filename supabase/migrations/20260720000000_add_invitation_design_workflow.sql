-- Invitation design workflow
-- Adds multi-stage status tracking, versioning, reviewer assignments, and meeting scheduling
-- for the centralized design flow where superadmins build every wedding invitation.

-- ─────────────────────────────────────────────────────────────
-- 1. Status column on weddings
-- ─────────────────────────────────────────────────────────────

ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS invitation_design_status TEXT NOT NULL DEFAULT 'not_started'
  CHECK (invitation_design_status IN (
    'not_started', 'design_started', 'ready_for_review', 'approved', 'live'
  ));

-- Weddings already marked as ready map to 'live'
UPDATE weddings
SET invitation_design_status = 'live'
WHERE is_ready = TRUE
  AND invitation_design_status = 'not_started';

CREATE INDEX IF NOT EXISTS idx_weddings_invitation_design_status
  ON weddings (invitation_design_status);

-- ─────────────────────────────────────────────────────────────
-- 2. Status history
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invitation_status_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  UUID        NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT        NOT NULL,
  changed_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_invitation_status_history_wedding
  ON invitation_status_history (wedding_id, changed_at DESC);

ALTER TABLE invitation_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can insert status history" ON invitation_status_history;
CREATE POLICY "Superadmins can insert status history"
  ON invitation_status_history FOR INSERT
  WITH CHECK (is_superuser());

-- ─────────────────────────────────────────────────────────────
-- 3. Design review requests (PR-style reviewer assignment)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS design_review_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id       UUID        NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  reviewer_email   TEXT        NOT NULL,
  reviewer_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status           TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'dismissed')),
  reviewed_at      TIMESTAMPTZ,
  notes            TEXT,
  UNIQUE (wedding_id, reviewer_email)
);

CREATE INDEX IF NOT EXISTS idx_design_review_requests_wedding
  ON design_review_requests (wedding_id);
CREATE INDEX IF NOT EXISTS idx_design_review_requests_email
  ON design_review_requests (reviewer_email);

ALTER TABLE design_review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can manage review requests" ON design_review_requests;
CREATE POLICY "Superadmins can manage review requests"
  ON design_review_requests FOR ALL
  USING (is_superuser())
  WITH CHECK (is_superuser());

DROP POLICY IF EXISTS "Reviewers can read their own requests" ON design_review_requests;
CREATE POLICY "Reviewers can read their own requests"
  ON design_review_requests FOR SELECT
  USING (
    reviewer_email = lower(auth.jwt() ->> 'email')
    OR reviewer_user_id = auth.uid()
    OR wedding_id IN (
      SELECT id FROM weddings WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Reviewers can update their own requests" ON design_review_requests;
CREATE POLICY "Reviewers can update their own requests"
  ON design_review_requests FOR UPDATE
  USING (
    reviewer_email = lower(auth.jwt() ->> 'email')
    OR reviewer_user_id = auth.uid()
  )
  WITH CHECK (
    reviewer_email = lower(auth.jwt() ->> 'email')
    OR reviewer_user_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- 4. Wedding versions (full config snapshots)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wedding_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id      UUID        NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  version_number  INTEGER     NOT NULL,
  label           TEXT        NOT NULL,
  config_snapshot JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT,
  UNIQUE (wedding_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_wedding_versions_wedding
  ON wedding_versions (wedding_id, version_number DESC);

ALTER TABLE wedding_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can manage versions" ON wedding_versions;
CREATE POLICY "Superadmins can manage versions"
  ON wedding_versions FOR ALL
  USING (is_superuser())
  WITH CHECK (is_superuser());

-- ─────────────────────────────────────────────────────────────
-- 5. Design meetings
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS design_meetings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id   UUID        NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  meeting_type TEXT        NOT NULL DEFAULT 'other'
    CHECK (meeting_type IN ('kickoff', 'review', 'final', 'other')),
  title        TEXT        NOT NULL,
  scheduled_at TIMESTAMPTZ,
  meeting_url  TEXT,
  notes        TEXT,
  status       TEXT        NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_design_meetings_wedding
  ON design_meetings (wedding_id, scheduled_at ASC);

ALTER TABLE design_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can manage meetings" ON design_meetings;
CREATE POLICY "Superadmins can manage meetings"
  ON design_meetings FOR ALL
  USING (is_superuser())
  WITH CHECK (is_superuser());

-- ─────────────────────────────────────────────────────────────
-- 6. Cross-table RLS policies (all tables now exist)
-- ─────────────────────────────────────────────────────────────

-- invitation_status_history: owners, collaborators, and reviewers can read
DROP POLICY IF EXISTS "Wedding members can read status history" ON invitation_status_history;
CREATE POLICY "Wedding members can read status history"
  ON invitation_status_history FOR SELECT
  USING (
    is_superuser()
    OR wedding_id IN (
      SELECT id FROM weddings
      WHERE owner_id = auth.uid()
         OR collaborator_emails @> ARRAY[lower(auth.jwt() ->> 'email')]
    )
    OR wedding_id IN (
      SELECT wedding_id FROM design_review_requests
      WHERE reviewer_email = lower(auth.jwt() ->> 'email')
        AND status != 'dismissed'
    )
  );

-- wedding_versions: owners, collaborators, and reviewers can read
DROP POLICY IF EXISTS "Wedding members can read versions" ON wedding_versions;
CREATE POLICY "Wedding members can read versions"
  ON wedding_versions FOR SELECT
  USING (
    is_superuser()
    OR wedding_id IN (
      SELECT id FROM weddings
      WHERE owner_id = auth.uid()
         OR collaborator_emails @> ARRAY[lower(auth.jwt() ->> 'email')]
    )
    OR wedding_id IN (
      SELECT wedding_id FROM design_review_requests
      WHERE reviewer_email = lower(auth.jwt() ->> 'email')
        AND status != 'dismissed'
    )
  );

-- design_meetings: owners, collaborators, and reviewers can read
DROP POLICY IF EXISTS "Wedding members can read meetings" ON design_meetings;
CREATE POLICY "Wedding members can read meetings"
  ON design_meetings FOR SELECT
  USING (
    is_superuser()
    OR wedding_id IN (
      SELECT id FROM weddings
      WHERE owner_id = auth.uid()
         OR collaborator_emails @> ARRAY[lower(auth.jwt() ->> 'email')]
    )
    OR wedding_id IN (
      SELECT wedding_id FROM design_review_requests
      WHERE reviewer_email = lower(auth.jwt() ->> 'email')
        AND status != 'dismissed'
    )
  );
