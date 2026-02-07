-- Convert invited_by values from raw partner names to 'partner1'/'partner2' references.
-- This ensures invited_by auto-updates when partner names change.

DO $$
DECLARE
  w RECORD;
BEGIN
  -- Loop over each wedding that has partner names
  FOR w IN
    SELECT id, partner1_first_name, partner2_first_name
    FROM weddings
    WHERE partner1_first_name IS NOT NULL OR partner2_first_name IS NOT NULL
  LOOP
    -- Replace partner1 name with 'partner1' reference
    IF w.partner1_first_name IS NOT NULL AND w.partner1_first_name <> '' THEN
      UPDATE guests
      SET invited_by = array_replace(invited_by, w.partner1_first_name, 'partner1'),
          updated_at = now()
      WHERE wedding_id = w.id
        AND w.partner1_first_name = ANY(invited_by)
        AND NOT ('partner1' = ANY(invited_by));

      -- Handle case where partner1 reference already exists alongside the name
      UPDATE guests
      SET invited_by = array_remove(invited_by, w.partner1_first_name),
          updated_at = now()
      WHERE wedding_id = w.id
        AND w.partner1_first_name = ANY(invited_by)
        AND 'partner1' = ANY(invited_by);
    END IF;

    -- Replace partner2 name with 'partner2' reference
    IF w.partner2_first_name IS NOT NULL AND w.partner2_first_name <> '' THEN
      UPDATE guests
      SET invited_by = array_replace(invited_by, w.partner2_first_name, 'partner2'),
          updated_at = now()
      WHERE wedding_id = w.id
        AND w.partner2_first_name = ANY(invited_by)
        AND NOT ('partner2' = ANY(invited_by));

      -- Handle case where partner2 reference already exists alongside the name
      UPDATE guests
      SET invited_by = array_remove(invited_by, w.partner2_first_name),
          updated_at = now()
      WHERE wedding_id = w.id
        AND w.partner2_first_name = ANY(invited_by)
        AND 'partner2' = ANY(invited_by);
    END IF;

    -- Remove any remaining invited_by values that don't match either partner
    -- (phantom values like "yuls" that don't match any partner name)
    UPDATE guests
    SET invited_by = ARRAY(
      SELECT unnest(invited_by)
      INTERSECT
      SELECT unnest(ARRAY['partner1', 'partner2'])
    ),
    updated_at = now()
    WHERE wedding_id = w.id
      AND invited_by <> ARRAY(
        SELECT unnest(invited_by)
        INTERSECT
        SELECT unnest(ARRAY['partner1', 'partner2'])
      );
  END LOOP;
END;
$$;
