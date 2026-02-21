-- Add capacity column to venue_elements (for periquera seat count, etc.)
alter table "venue_elements"
  add column if not exists "capacity" integer not null default 4;

-- Extend element_type to include 'area' zones
alter table "venue_elements"
  drop constraint if exists venue_elements_element_type_check;
alter table "venue_elements"
  add constraint venue_elements_element_type_check
    check ("element_type" in ('dance_floor', 'stage', 'entrance', 'bar', 'dj_booth', 'periquera', 'lounge', 'custom', 'area'));

-- Extend element_shape to include lounge sofa variants
alter table "venue_elements"
  drop constraint if exists venue_elements_element_shape_check;
alter table "venue_elements"
  add constraint venue_elements_element_shape_check
    check ("element_shape" in ('rect', 'circle', 'sofa_single', 'sofa_l', 'sofa_u', 'sofa_circle'));
