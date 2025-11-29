alter table "public"."weddings" add constraint "weddings_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."weddings" validate constraint "weddings_owner_id_fkey";


