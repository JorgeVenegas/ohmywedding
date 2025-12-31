-- Add Open Graph metadata fields to weddings table
ALTER TABLE "public"."weddings" 
ADD COLUMN IF NOT EXISTS "og_title" text,
ADD COLUMN IF NOT EXISTS "og_description" text,
ADD COLUMN IF NOT EXISTS "og_image_url" text;

-- Add comment explaining the fields
COMMENT ON COLUMN "public"."weddings"."og_title" IS 'Custom Open Graph title for social media sharing';
COMMENT ON COLUMN "public"."weddings"."og_description" IS 'Custom Open Graph description for social media sharing';
COMMENT ON COLUMN "public"."weddings"."og_image_url" IS 'Custom Open Graph image URL for social media sharing';
