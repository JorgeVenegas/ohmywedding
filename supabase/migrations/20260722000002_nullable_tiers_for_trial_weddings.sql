-- invitation_tier and management_tier were added with NOT NULL DEFAULT 'basic',
-- which means every wedding — including trial/unactivated ones (plan='none') —
-- appeared to have the Basic tier active. Null now means "nothing purchased yet".

-- 1. Drop NOT NULL and change default to null on both columns
ALTER TABLE wedding_subscriptions
  ALTER COLUMN invitation_tier DROP NOT NULL,
  ALTER COLUMN invitation_tier SET DEFAULT NULL,
  ALTER COLUMN management_tier DROP NOT NULL,
  ALTER COLUMN management_tier SET DEFAULT NULL;

-- 2. Nullify tiers for weddings that have never paid (plan = 'none')
UPDATE wedding_subscriptions
SET invitation_tier = NULL,
    management_tier = NULL
WHERE plan = 'none'
  AND invitation_tier = 'basic'
  AND management_tier = 'basic';
