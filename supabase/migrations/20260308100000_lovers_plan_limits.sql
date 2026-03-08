-- Migration: Rename free plan to "Lovers" and update limits
-- - Increase guests_limit: 50 → 100
-- - Decrease activity_tracking_limit: 8 → 3
-- - Add suppliers_limit (free: 3, premium/deluxe: unlimited)
-- - Add menus_limit (free: 1, premium/deluxe: unlimited)
-- - Add itinerary_limit (free: 5, premium/deluxe: unlimited)

-- Update existing free plan limits
UPDATE plan_features
  SET limit_value = 100
  WHERE plan = 'free' AND feature_key = 'guests_limit';

UPDATE plan_features
  SET limit_value = 3
  WHERE plan = 'free' AND feature_key = 'activity_tracking_limit';

-- Add suppliers_limit for all plans (upsert to be idempotent)
INSERT INTO plan_features (plan, feature_key, enabled, limit_value, config_json, description)
VALUES
  ('free',    'suppliers_limit', true,  3,    '{}', 'Maximum number of suppliers allowed (Lovers plan)'),
  ('premium', 'suppliers_limit', true,  null, '{}', 'Unlimited suppliers (Premium plan)'),
  ('deluxe',  'suppliers_limit', true,  null, '{}', 'Unlimited suppliers (Deluxe plan)')
ON CONFLICT (plan, feature_key) DO UPDATE
  SET limit_value = EXCLUDED.limit_value,
      enabled     = EXCLUDED.enabled,
      description = EXCLUDED.description;

-- Add menus_limit for all plans
INSERT INTO plan_features (plan, feature_key, enabled, limit_value, config_json, description)
VALUES
  ('free',    'menus_limit', true,  1,    '{}', 'Maximum number of menus allowed (Lovers plan)'),
  ('premium', 'menus_limit', true,  null, '{}', 'Unlimited menus (Premium plan)'),
  ('deluxe',  'menus_limit', true,  null, '{}', 'Unlimited menus (Deluxe plan)')
ON CONFLICT (plan, feature_key) DO UPDATE
  SET limit_value = EXCLUDED.limit_value,
      enabled     = EXCLUDED.enabled,
      description = EXCLUDED.description;

-- Add itinerary_limit for all plans
INSERT INTO plan_features (plan, feature_key, enabled, limit_value, config_json, description)
VALUES
  ('free',    'itinerary_limit', true,  5,    '{}', 'Maximum number of itinerary events allowed (Lovers plan)'),
  ('premium', 'itinerary_limit', true,  null, '{}', 'Unlimited itinerary events (Premium plan)'),
  ('deluxe',  'itinerary_limit', true,  null, '{}', 'Unlimited itinerary events (Deluxe plan)')
ON CONFLICT (plan, feature_key) DO UPDATE
  SET limit_value = EXCLUDED.limit_value,
      enabled     = EXCLUDED.enabled,
      description = EXCLUDED.description;
