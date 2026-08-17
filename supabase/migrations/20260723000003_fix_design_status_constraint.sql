-- The original ADD COLUMN … CHECK (…) gave the constraint an auto-generated name that
-- may differ from 'weddings_invitation_design_status_check'.  Drop every CHECK constraint
-- on invitation_design_status (whatever Postgres named it) then re-add the correct one.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM   pg_constraint  c
    JOIN   pg_class       cl ON cl.oid = c.conrelid
    JOIN   pg_attribute   a  ON a.attrelid = c.conrelid
                             AND a.attnum  = ANY(c.conkey)
    WHERE  cl.relname   = 'weddings'
      AND  c.contype    = 'c'          -- CHECK constraint
      AND  a.attname    = 'invitation_design_status'
  LOOP
    EXECUTE format('ALTER TABLE weddings DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

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
