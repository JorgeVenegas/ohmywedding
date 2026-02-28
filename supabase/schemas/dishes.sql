-- Dishes and food management for wedding events

create table "dishes" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "name" text not null,
  "description" text,
  "category" text not null default 'main' check ("category" in ('appetizer', 'soup', 'salad', 'main', 'dessert', 'drink', 'other')),
  "is_vegetarian" boolean default false,
  "is_vegan" boolean default false,
  "is_gluten_free" boolean default false,
  "allergens" text,
  "display_order" integer not null default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

create index "idx_dishes_wedding" on dishes (wedding_id);

create table "guest_dish_assignments" (
  "id" uuid primary key default gen_random_uuid(),
  "wedding_id" uuid not null references weddings(id) on delete cascade,
  "guest_id" uuid not null references guests(id) on delete cascade,
  "dish_id" uuid not null references dishes(id) on delete cascade,
  "created_at" timestamp with time zone default now()
);

create unique index "idx_guest_dish_unique" on guest_dish_assignments (wedding_id, guest_id);
create index "idx_guest_dish_dish" on guest_dish_assignments (dish_id);
create index "idx_guest_dish_guest" on guest_dish_assignments (guest_id);

create trigger "update_dishes_updated_at"
  before update on dishes
  for each row
  execute function update_updated_at_column();

-- Menus: multi-course meals assigned to guests

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

create table "menu_courses" (
  "id" uuid primary key default gen_random_uuid(),
  "menu_id" uuid not null references menus(id) on delete cascade,
  "course_number" integer not null check (course_number between 1 and 5),
  "course_name" text,
  "dish_id" uuid references dishes(id) on delete set null,
  unique("menu_id", "course_number")
);

create index "idx_menu_courses_menu" on menu_courses (menu_id);

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
