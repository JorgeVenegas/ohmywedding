import { createAdminSupabaseClient } from '@/lib/supabase-server'

export interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function loadMessages(
  conversationId: string,
  limit = 20
): Promise<StoredMessage[]> {
  const admin = createAdminSupabaseClient()

  const { data } = await admin
    .from('ai_messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []
  return (data as StoredMessage[]).reverse()
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  toolCalls?: unknown,
  toolResults?: unknown
): Promise<void> {
  const admin = createAdminSupabaseClient()

  await admin.from('ai_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    tool_calls: toolCalls ?? null,
    tool_results: toolResults ?? null,
  })
}

export async function getMessageCount(conversationId: string): Promise<number> {
  const admin = createAdminSupabaseClient()

  const { count } = await admin
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  return count ?? 0
}

export async function deleteOldMessages(
  conversationId: string,
  keepLast: number
): Promise<void> {
  const admin = createAdminSupabaseClient()

  const { data } = await admin
    .from('ai_messages')
    .select('id, created_at')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })

  if (!data || data.length <= keepLast) return

  const toDelete = data.slice(keepLast).map(m => m.id)
  await admin.from('ai_messages').delete().in('id', toDelete)
}

export async function ensureConversation(
  conversationId: string,
  weddingId: string,
  userId: string | null,
  role: string,
  channel: string
): Promise<void> {
  const admin = createAdminSupabaseClient()

  await admin.from('ai_conversations').upsert(
    {
      id: conversationId,
      wedding_id: weddingId,
      user_id: userId,
      role,
      channel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: false }
  )
}
