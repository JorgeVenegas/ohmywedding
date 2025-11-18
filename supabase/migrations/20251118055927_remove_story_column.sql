-- Remove the story column from weddings table
-- Story content is now stored in page_config as part of the our-story section configuration

ALTER TABLE weddings DROP COLUMN IF EXISTS story;
