-- Add element_shape column and expand element_type check constraint for venue_elements

-- 1. Add element_shape column (defaults to 'rect' for existing rows)
alter table "venue_elements"
  add column if not exists "element_shape" text not null default 'rect' check ("element_shape" in ('rect', 'circle'));

-- 2. Update element_type check constraint to include new types
alter table "venue_elements" drop constraint if exists "venue_elements_element_type_check";

alter table "venue_elements"
  add constraint "venue_elements_element_type_check"
  check ("element_type" in ('dance_floor', 'stage', 'entrance', 'bar', 'dj_booth', 'periquera', 'lounge', 'custom'));
