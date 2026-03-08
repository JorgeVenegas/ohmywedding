-- Migration: Replace flat discount percentages with per-plan discounts

-- 1. Add per-plan columns
ALTER TABLE public.global_discounts
  ADD COLUMN IF NOT EXISTS premium_card_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (premium_card_discount_percent >= 0 AND premium_card_discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS premium_msi_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (premium_msi_discount_percent >= 0 AND premium_msi_discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS deluxe_card_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (deluxe_card_discount_percent >= 0 AND deluxe_card_discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS deluxe_msi_discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (deluxe_msi_discount_percent >= 0 AND deluxe_msi_discount_percent <= 100);

-- 2. Copy existing values to new columns (migrate existing data)
UPDATE public.global_discounts SET
  premium_card_discount_percent = COALESCE(card_discount_percent, 0),
  premium_msi_discount_percent = COALESCE(msi_discount_percent, 0),
  deluxe_card_discount_percent = COALESCE(card_discount_percent, 0),
  deluxe_msi_discount_percent = COALESCE(msi_discount_percent, 0);

-- 3. Drop old flat columns
ALTER TABLE public.global_discounts
  DROP COLUMN IF EXISTS card_discount_percent,
  DROP COLUMN IF EXISTS msi_discount_percent,
  DROP COLUMN IF EXISTS transfer_discount_percent;
