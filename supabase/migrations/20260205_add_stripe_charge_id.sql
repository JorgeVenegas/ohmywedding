-- Add stripe_charge_id to registry_contributions for direct charge tracking
alter table "registry_contributions" add column "stripe_charge_id" text unique;
