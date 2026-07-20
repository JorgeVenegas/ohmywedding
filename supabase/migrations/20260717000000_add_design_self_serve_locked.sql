-- Centralize wedding website design to superadmins going forward.
-- New/uncustomized weddings default to locked (design_self_serve_locked = true);
-- weddings that already have a live, customized site are grandfathered with
-- self-serve editing left on, snapshotted once here rather than derived
-- dynamically (so a newly-locked wedding can't later flip itself back open).

ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS design_self_serve_locked BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE weddings
SET design_self_serve_locked = FALSE
WHERE has_website = TRUE
   OR (page_config IS NOT NULL AND page_config != '{}'::jsonb);
