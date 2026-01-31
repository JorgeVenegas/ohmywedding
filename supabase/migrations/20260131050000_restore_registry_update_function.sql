-- Restore the update_registry_item_amount function that was accidentally dropped
-- This function updates the current_amount of a custom_registry_item when a payment is completed

create or replace function public.update_registry_item_amount(
  p_item_id uuid,
  p_amount_to_add numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update custom_registry_items
  set current_amount = current_amount + p_amount_to_add,
      updated_at = now()
  where id = p_item_id;
end;
$$;

-- Grant execute permission to authenticated and anon users (for webhooks)
grant execute on function public.update_registry_item_amount(uuid, numeric) to authenticated, anon;
