import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function markSnapshotStale(weddingId: string): Promise<void> {
  const admin = createAdminSupabaseClient()
  await admin
    .from('ai_wedding_snapshots')
    .upsert(
      { wedding_id: weddingId, snapshot: {}, invalidated_at: new Date().toISOString() },
      { onConflict: 'wedding_id' }
    )
}
