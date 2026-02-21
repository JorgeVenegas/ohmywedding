-- Add locked column to venue_elements to allow locking area/zone elements
-- Locked elements are visible but pass through clicks, preventing accidental drag/resize

alter table venue_elements add column if not exists locked boolean not null default false;
