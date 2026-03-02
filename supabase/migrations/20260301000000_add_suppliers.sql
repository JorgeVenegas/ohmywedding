-- Migration: Add suppliers and supplier_payments tables
-- Tracks wedding vendors (DJ, catering, photography, etc.) with individual payment tracking

create table if not exists "suppliers" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "name" text not null,
  "category" text not null default 'other',
  "contact_info" text,
  "contact_type" text not null default 'email' check ("contact_type" in ('phone', 'email', 'website', 'other')),
  "contract_url" text,
  "total_amount" numeric(12, 2) not null default 0,
  "notes" text,
  "display_order" integer not null default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

create index if not exists "idx_suppliers_wedding" on suppliers (wedding_id);

-- Individual payments made to each supplier
create table if not exists "supplier_payments" (
  "id" uuid primary key default gen_random_uuid(),
  "supplier_id" uuid not null references suppliers(id) on delete cascade,
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "amount" numeric(12, 2) not null,
  "payment_date" date not null default current_date,
  "notes" text,
  "created_at" timestamp with time zone default now()
);

create index if not exists "idx_supplier_payments_supplier" on supplier_payments (supplier_id);
create index if not exists "idx_supplier_payments_wedding" on supplier_payments (wedding_id);

-- RLS Policies for suppliers
alter table "suppliers" enable row level security;

create policy "Wedding owners and editors can manage suppliers"
  on suppliers
  for all
  using (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  )
  with check (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  );

-- RLS Policies for supplier_payments
alter table "supplier_payments" enable row level security;

create policy "Wedding owners and editors can manage supplier payments"
  on supplier_payments
  for all
  using (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  )
  with check (
    auth.uid() is not null and
    wedding_id in (
      select id from weddings
      where owner_id = auth.uid()
        or owner_id is null
        or auth.jwt() ->> 'email' = any(collaborator_emails)
    )
  );

-- Trigger for updated_at on suppliers
create or replace trigger "update_suppliers_updated_at"
  before update on suppliers
  for each row
  execute function update_updated_at_column();
