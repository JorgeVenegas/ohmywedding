import { createAdminSupabaseClient } from '@/lib/supabase-server'

export type ActivityEventType =
  | 'meeting_scheduled'
  | 'meeting_rescheduled'
  | 'meeting_cancelled'
  | 'meeting_deleted'
  | 'meeting_created'
  | 'meeting_updated'

export interface ActivityLogEntry {
  id: string
  wedding_id: string
  event_type: ActivityEventType
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function logActivity({
  weddingId,
  eventType,
  title,
  description,
  metadata,
}: {
  weddingId: string
  eventType: ActivityEventType
  title: string
  description?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const adminClient = createAdminSupabaseClient()
    const { error } = await adminClient.from('invitation_activity_logs').insert({
      wedding_id: weddingId,
      event_type: eventType,
      title,
      description: description ?? null,
      metadata: metadata ?? null,
    })
    if (error) console.error('[activity-log] insert error:', error)
  } catch (err) {
    console.error('[activity-log] unexpected error:', err)
  }
}
