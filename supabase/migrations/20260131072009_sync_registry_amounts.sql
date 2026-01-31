-- Data migration to sync registry item amounts with their completed contributions
-- This updates each item's current_amount to match the sum of completed payments

update custom_registry_items
set current_amount = (
  select coalesce(sum(amount), 0)
  from registry_contributions
  where custom_registry_item_id = custom_registry_items.id
    and payment_status = 'completed'
),
updated_at = now()
where id in (
  select distinct custom_registry_item_id
  from registry_contributions
  where payment_status = 'completed'
);
