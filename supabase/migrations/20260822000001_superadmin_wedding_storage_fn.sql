-- Returns per-table row count and compressed byte size for a given wedding.
-- pg_column_size(row) measures the in-memory compressed size — a good proxy
-- for actual on-disk row storage. Does not include indexes or TOAST overhead,
-- but gives a meaningful breakdown for comparing weddings.
CREATE OR REPLACE FUNCTION superadmin_wedding_storage(p_wedding_id uuid)
RETURNS TABLE(table_name text, row_count bigint, size_bytes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'guests',               count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM guests              t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'guest_groups',         count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM guest_groups        t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'rsvps',                count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM rsvps               t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'wedding_schedule',     count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM wedding_schedule    t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'wedding_pages',        count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM wedding_pages       t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'wedding_faqs',         count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM wedding_faqs        t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'images',               count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM images              t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'gallery_albums',       count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM gallery_albums      t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'gallery_photos',       count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM gallery_photos      t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'gift_registries',      count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM gift_registries     t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'gift_items',           count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM gift_items          t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'guest_photos',         count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM guest_photos        t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'conversations',        count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM conversations       t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'contacts',             count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM contacts            t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'suppliers',            count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM suppliers           t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'supplier_payments',    count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM supplier_payments   t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'invitation_logs',      count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM invitation_activity_logs t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'whatsapp_accounts',    count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM whatsapp_accounts     t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'wedding_subscriptions',count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM wedding_subscriptions t WHERE t.wedding_id = p_wedding_id
  UNION ALL
  SELECT 'wedding_settings',     count(*)::bigint, COALESCE(sum(pg_column_size(t)), 0)::bigint FROM wedding_settings    t WHERE t.wedding_id = p_wedding_id
$$;

GRANT EXECUTE ON FUNCTION superadmin_wedding_storage(uuid) TO service_role;
