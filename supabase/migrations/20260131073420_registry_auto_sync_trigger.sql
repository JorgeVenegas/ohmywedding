-- Robust registry sync: Use a trigger to automatically keep current_amount in sync
-- This prevents any desync issues by recalculating from source of truth (completed payments)

-- Drop the old RPC function if it exists (we'll use triggers instead)
drop function if exists public.update_registry_item_amount(uuid, numeric);

-- Create a function that recalculates the current_amount from completed contributions
create or replace function public.sync_registry_item_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_new_amount numeric;
begin
  -- Get the item id based on operation
  if TG_OP = 'DELETE' then
    v_item_id := OLD.custom_registry_item_id;
  else
    v_item_id := NEW.custom_registry_item_id;
  end if;

  -- Recalculate the total from all completed contributions (source of truth)
  select coalesce(sum(amount), 0)
  into v_new_amount
  from registry_contributions
  where custom_registry_item_id = v_item_id
    and payment_status = 'completed';

  -- Update the registry item with the calculated amount
  update custom_registry_items
  set current_amount = v_new_amount,
      updated_at = now()
  where id = v_item_id;

  -- Return appropriate value based on operation
  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

-- Create trigger that fires after any change to registry_contributions
drop trigger if exists trg_sync_registry_amount on registry_contributions;

create trigger trg_sync_registry_amount
after insert or update or delete on registry_contributions
for each row
execute function sync_registry_item_amount();

-- Now do an initial sync to fix all existing items
update custom_registry_items
set current_amount = (
  select coalesce(sum(amount), 0)
  from registry_contributions
  where custom_registry_item_id = custom_registry_items.id
    and payment_status = 'completed'
),
updated_at = now();

-- Grant permissions
grant execute on function public.sync_registry_item_amount() to authenticated, anon, service_role;
