-- Add dish_name as plain text to menu_courses (replaces dish_id FK for simpler UX)
alter table menu_courses add column if not exists "dish_name" text;
