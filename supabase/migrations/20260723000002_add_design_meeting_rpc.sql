-- RPC for inserting a design meeting row — bypasses PostgREST schema cache (PGRST204)
-- which occurs after adding google_event_id to design_meetings before PostgREST reloads.
-- Pattern matches set_wedding_design_status.

CREATE OR REPLACE FUNCTION insert_design_meeting(
  p_wedding_id      uuid,
  p_meeting_type    text,
  p_title           text,
  p_scheduled_at    timestamptz,
  p_meeting_url     text     DEFAULT NULL,
  p_google_event_id text     DEFAULT NULL,
  p_notes           text     DEFAULT NULL,
  p_status          text     DEFAULT 'scheduled',
  p_created_by      uuid     DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row design_meetings;
BEGIN
  INSERT INTO design_meetings (
    wedding_id, meeting_type, title, scheduled_at,
    meeting_url, google_event_id, notes, status, created_by
  ) VALUES (
    p_wedding_id, p_meeting_type, p_title, p_scheduled_at,
    p_meeting_url, p_google_event_id, p_notes, p_status, p_created_by
  )
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

-- Also tell PostgREST to reload so the REST insert path works too
SELECT pg_notify('pgrst', 'reload schema');
