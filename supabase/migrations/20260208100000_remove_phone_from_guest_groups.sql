-- Remove phone_number from guest_groups table
-- Phone numbers now live exclusively at the guest level
-- When sending group invites, phone numbers are retrieved from individual guests with phone numbers

ALTER TABLE "guest_groups" DROP COLUMN IF EXISTS "phone_number";

