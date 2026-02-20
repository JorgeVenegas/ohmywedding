-- Add head seat counts to rectangular tables
alter table "seating_tables"
  add column "head_a_count" integer,  -- Guests at head end A (left short side)
  add column "head_b_count" integer;  -- Guests at head end B (right short side)
