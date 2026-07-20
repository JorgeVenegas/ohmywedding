-- Split pricing into two independently-purchasable axes: Invitation and
-- Management. The legacy `plan` column is kept as a derived/backward-compatible
-- field (see lib/subscription-shared.ts deriveLegacyPlan) so the existing
-- feature-gating call sites and middleware subdomain routing keep working
-- unchanged while these two new columns become the source of truth going forward.

ALTER TABLE wedding_subscriptions
  ADD COLUMN IF NOT EXISTS invitation_tier TEXT NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS management_tier TEXT NOT NULL DEFAULT 'basic';

ALTER TABLE wedding_subscriptions
  ADD CONSTRAINT wedding_subscriptions_invitation_tier_check
  CHECK (invitation_tier IN ('basic', 'personalized', 'bespoke'));

ALTER TABLE wedding_subscriptions
  ADD CONSTRAINT wedding_subscriptions_management_tier_check
  CHECK (management_tier IN ('basic', 'pro', 'agency'));

-- Backfill existing rows from the legacy plan so premium/deluxe weddings show
-- up correctly under the new axes rather than defaulting to basic/basic.
UPDATE wedding_subscriptions
SET invitation_tier = CASE plan WHEN 'deluxe' THEN 'bespoke' WHEN 'premium' THEN 'personalized' ELSE 'basic' END,
    management_tier = CASE plan WHEN 'deluxe' THEN 'agency' WHEN 'premium' THEN 'pro' ELSE 'basic' END;
