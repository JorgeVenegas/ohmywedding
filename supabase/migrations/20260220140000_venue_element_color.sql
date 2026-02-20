-- Add custom color to venue_elements
alter table venue_elements add column if not exists "color" text;
