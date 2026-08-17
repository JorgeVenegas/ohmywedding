-- Extend invitation_design_status to support the full per-plan design workflow.
-- New statuses:
--   discovery_meeting  — Bespoke only: initial moodboard + brief meeting
--   review_meeting     — Bespoke only: presentation meeting (first draft walk-through)
--   changes_in_progress — Bespoke + Personalized: changes being incorporated after feedback

ALTER TABLE weddings
  DROP CONSTRAINT IF EXISTS weddings_invitation_design_status_check;

ALTER TABLE weddings
  ADD CONSTRAINT weddings_invitation_design_status_check
  CHECK (invitation_design_status IN (
    'not_started',
    'discovery_meeting',
    'design_started',
    'ready_for_review',
    'review_meeting',
    'changes_in_progress',
    'approved',
    'live'
  ));
