import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Checks the `superusers` table for an active superuser record.
 * Prefer passing `userId` (matches the caller's own RLS-scoped session);
 * pass an admin/service-role client + `email` when checking someone else's
 * status (e.g. a collaborator), since RLS won't allow looking up other users.
 */
export async function isSuperUser(
  supabase: SupabaseClient,
  { userId, email }: { userId?: string | null; email?: string | null }
): Promise<boolean> {
  if (!userId && !email) return false

  const query = supabase.from('superusers').select('id').eq('is_active', true)
  const { data } = await (userId
    ? query.eq('user_id', userId)
    : query.eq('email', email!.toLowerCase())
  ).maybeSingle()

  return !!data
}
