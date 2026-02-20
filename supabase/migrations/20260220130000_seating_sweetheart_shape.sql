-- Allow 'sweetheart' as a valid table shape
ALTER TABLE seating_tables
  DROP CONSTRAINT IF EXISTS seating_tables_shape_check;

ALTER TABLE seating_tables
  ADD CONSTRAINT seating_tables_shape_check
  CHECK (shape IN ('round', 'rectangular', 'sweetheart'));
