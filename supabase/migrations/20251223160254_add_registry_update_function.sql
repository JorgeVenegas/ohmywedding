-- Create a function to update registry item amount (bypasses RLS for webhook)
create or replace function public.update_registry_item_amount(
  p_item_id uuid,
  p_amount_to_add numeric
)
returns void
language plpgsql
security definer -- This allows the function to bypass RLS
set search_path = public
as $$
begin
  update custom_registry_items
  set current_amount = current_amount + p_amount_to_add,
      updated_at = now()
  where id = p_item_id;
end;
$$;

-- Grant execute permission to authenticated and anon users
grant execute on function public.update_registry_item_amount(uuid, numeric) to authenticated, anon;
