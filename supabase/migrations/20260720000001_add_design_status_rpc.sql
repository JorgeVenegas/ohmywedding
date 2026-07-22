-- Helper RPC for updating invitation_design_status + syncing is_ready.
-- Called from the API route to bypass PostgREST schema-cache issues (PGRST204)
-- that occur when the REST table API is used before the cache has refreshed
-- after the column was added in migration 20260720000000.

CREATE OR REPLACE FUNCTION set_wedding_design_status(
  p_wedding_id  uuid,
  p_status      text,
  p_changed_by  uuid,
  p_notes       text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_status text;
BEGIN
  -- Read current status for history row
  SELECT invitation_design_status
    INTO v_from_status
    FROM weddings
   WHERE id = p_wedding_id;

  -- Update status and sync is_ready flag
  UPDATE weddings
     SET invitation_design_status = p_status,
         is_ready = (p_status = 'live')
   WHERE id = p_wedding_id;

  -- Write history entry
  INSERT INTO invitation_status_history (wedding_id, from_status, to_status, changed_by, notes)
  VALUES (p_wedding_id, v_from_status, p_status, p_changed_by, p_notes);
END;
$$;
