import { createAdminSupabaseClient } from "@/lib/supabase-server"

export interface QueueMessage {
  msg_id: number
  read_ct: number
  enqueued_at: string
  vt: string
  message: { webhook_event_id?: string }
}

// Thin wrapper around the public.messaging_queue_* SQL functions (see the
// add_messaging_platform migration), which wrap pgmq so the service-role client
// never has to be granted access to the pgmq schema directly.

export async function readQueueBatch(qty = 10, visibilityTimeoutSeconds = 30): Promise<QueueMessage[]> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.rpc("messaging_queue_read", {
    p_qty: qty,
    p_vt: visibilityTimeoutSeconds,
  })
  if (error) throw error
  return (data ?? []) as QueueMessage[]
}

export async function ackQueueMessage(msgId: number): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.rpc("messaging_queue_ack", { p_msg_id: msgId })
  if (error) throw error
}
