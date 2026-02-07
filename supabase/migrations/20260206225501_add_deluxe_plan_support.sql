-- Add 'deluxe' plan type support to user_subscriptions

-- Drop the existing check constraint
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_plan_type_check;

-- Add new constraint that includes 'deluxe'
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_plan_type_check 
CHECK (plan_type IN ('free', 'premium', 'deluxe'));
