-- Gift registry and wishlist tables
create table "gift_registries" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "registry_name" text not null,
  "store_name" text,
  "registry_url" text,
  "description" text,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now()
);

-- Individual gift items
create table "gift_items" (
  "id" uuid primary key default gen_random_uuid(),
  "registry_id" uuid references gift_registries(id) on delete cascade,
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "item_name" text not null,
  "description" text,
  "price" decimal(10,2),
  "item_url" text,
  "image_url" text,
  "is_purchased" boolean default false,
  "purchased_by" text,
  "purchased_at" timestamp with time zone,
  "created_at" timestamp with time zone default now()
);

-- Custom registry items (for experiences, funds, etc.)
create table "custom_registry_items" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "title" text not null,
  "description" text,
  "goal_amount" decimal(10,2) not null default 0,
  "current_amount" decimal(10,2) not null default 0,
  "image_urls" text[] default '{}',
  "is_active" boolean default true,
  "display_order" integer default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

-- Registry contributions tracking
create table "registry_contributions" (
  "id" uuid primary key default gen_random_uuid(),
  "custom_registry_item_id" uuid not null references custom_registry_items(id) on delete cascade,
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "contributor_name" text,
  "contributor_email" text,
  "amount" decimal(10,2) not null,
  "message" text,
  "stripe_payment_intent_id" text unique,
  "stripe_checkout_session_id" text unique,
  "stripe_charge_id" text unique,
  "stripe_customer_id" text,
  "payment_status" text default 'pending',
  "guest_covers_fee" boolean default false,
  "original_requested_amount" decimal(10,2),
  "parent_contribution_id" uuid references registry_contributions(id) on delete set null,
  "created_at" timestamp with time zone default now()
);

-- Sync trigger: automatically recalculate current_amount when contributions change
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
  if TG_OP = 'DELETE' then
    v_item_id := OLD.custom_registry_item_id;
  else
    v_item_id := NEW.custom_registry_item_id;
  end if;

  select coalesce(sum(amount), 0)
  into v_new_amount
  from registry_contributions
  where custom_registry_item_id = v_item_id
    and payment_status = 'completed';

  update custom_registry_items
  set current_amount = v_new_amount,
      updated_at = now()
  where id = v_item_id;

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

drop trigger if exists trg_sync_registry_amount on registry_contributions;

create trigger trg_sync_registry_amount
after insert or update or delete on registry_contributions
for each row
execute function sync_registry_item_amount();

grant execute on function public.sync_registry_item_amount() to authenticated, anon, service_role;