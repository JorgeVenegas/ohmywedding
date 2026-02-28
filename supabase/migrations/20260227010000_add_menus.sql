-- Menus: containers for multi-course meals assigned to guests
create table "menus" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "name" text not null,
  "description" text,
  "image_url" text,
  "courses_count" integer not null default 3 check (courses_count between 2 and 5),
  "display_order" integer not null default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

create index "idx_menus_wedding" on menus (wedding_id);

-- Each row represents one course slot in a menu
create table "menu_courses" (
  "id" uuid primary key default gen_random_uuid(),
  "menu_id" uuid not null references menus(id) on delete cascade,
  "course_number" integer not null check (course_number between 1 and 5),
  "course_name" text,
  "dish_id" uuid references dishes(id) on delete set null,
  unique("menu_id", "course_number")
);

create index "idx_menu_courses_menu" on menu_courses (menu_id);

-- Assign a menu to a guest (one menu per guest)
create table "guest_menu_assignments" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_id" uuid not null references guests(id) on delete cascade,
  "menu_id" uuid not null references menus(id) on delete cascade,
  "created_at" timestamp with time zone default now(),
  unique("wedding_id", "guest_id")
);

create index "idx_guest_menu_assignments_menu" on guest_menu_assignments (menu_id);
create index "idx_guest_menu_assignments_guest" on guest_menu_assignments (guest_id);

create trigger "update_menus_updated_at"
  before update on menus
  for each row
  execute function update_updated_at_column();

-- RLS
alter table menus enable row level security;
alter table menu_courses enable row level security;
alter table guest_menu_assignments enable row level security;

create policy "Users can view menus for their weddings" on menus
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Users can manage menus for their weddings" on menus
  for all using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Users can view menu courses for their weddings" on menu_courses
  for select using (
    menu_id in (select id from menus where
      wedding_id in (select id from weddings where owner_id = auth.uid())
      or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
    )
  );

create policy "Users can manage menu courses for their weddings" on menu_courses
  for all using (
    menu_id in (select id from menus where
      wedding_id in (select id from weddings where owner_id = auth.uid())
      or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
    )
  );

create policy "Users can view menu assignments for their weddings" on guest_menu_assignments
  for select using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );

create policy "Users can manage menu assignments for their weddings" on guest_menu_assignments
  for all using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
    or wedding_id in (select id from weddings where auth.jwt()->>'email' = any(collaborator_emails))
  );
