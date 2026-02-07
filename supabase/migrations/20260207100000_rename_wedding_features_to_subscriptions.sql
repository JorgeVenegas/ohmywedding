-- Migration: Rename wedding_features to wedding_subscriptions and remove user_subscriptions
-- 
-- This migration makes the following changes:
-- 1. Drop the user_subscriptions table (per-user subscriptions should not exist)
-- 2. Rename wedding_features table to wedding_subscriptions
-- 3. Remove individual feature flag columns (features should come from plan_features)
-- 4. Keep only: id, wedding_id, plan, created_at, updated_at

-- First, drop the user_subscriptions table and its dependencies
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- Drop the get_user_plan and get_plan_features functions if they exist
DROP FUNCTION IF EXISTS public.get_user_plan(UUID);
DROP FUNCTION IF EXISTS public.get_plan_features(TEXT);

-- Now handle the wedding_features table rename
-- First drop existing triggers and policies
DROP TRIGGER IF EXISTS update_wedding_features_updated_at ON public.wedding_features CASCADE;
DROP POLICY IF EXISTS "Wedding owners can view their features" ON public.wedding_features;
DROP POLICY IF EXISTS "Wedding owners can update their features" ON public.wedding_features;
DROP POLICY IF EXISTS "Wedding owners can insert their features" ON public.wedding_features;

-- Create the new wedding_subscriptions table with simplified schema
CREATE TABLE IF NOT EXISTS public.wedding_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  
  -- Plan information
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'deluxe')),
  
  -- Subscription metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT wedding_subscriptions_wedding_id_unique UNIQUE (wedding_id)
);

-- Copy data from wedding_features to wedding_subscriptions (only plan info)
INSERT INTO public.wedding_subscriptions (id, wedding_id, plan, created_at, updated_at)
SELECT id, wedding_id, COALESCE(plan, 'free'), created_at, updated_at
FROM public.wedding_features
ON CONFLICT (wedding_id) DO NOTHING;

-- Drop the old wedding_features table
DROP TABLE IF EXISTS public.wedding_features CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wedding_subscriptions_wedding_id ON public.wedding_subscriptions(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_subscriptions_plan ON public.wedding_subscriptions(plan);

-- Enable Row Level Security
ALTER TABLE public.wedding_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wedding_subscriptions
-- Wedding owners and collaborators can view their subscription
CREATE POLICY "Wedding owners and collaborators can view subscriptions"
  ON public.wedding_subscriptions
  FOR SELECT
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
        OR collaborator_emails @> ARRAY[auth.jwt()->>'email']
    )
  );

-- Only the wedding owner can update their subscription (typically admin only)
CREATE POLICY "Wedding owners can update their subscriptions"
  ON public.wedding_subscriptions
  FOR UPDATE
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Only the wedding owner can insert subscriptions
CREATE POLICY "Wedding owners can insert their subscriptions"
  ON public.wedding_subscriptions
  FOR INSERT
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings 
      WHERE owner_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_wedding_subscriptions_updated_at
  BEFORE UPDATE ON public.wedding_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.wedding_subscriptions TO authenticated;
