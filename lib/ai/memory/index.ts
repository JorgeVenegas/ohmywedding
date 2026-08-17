import type { ModelMessage } from 'ai'
import { loadMessages, saveMessage, getMessageCount, ensureConversation } from './storage'

export { saveMessage, ensureConversation }

const HISTORY_LIMIT = 20
const SUMMARIZE_THRESHOLD = 40

export async function loadHistory(conversationId: string): Promise<ModelMessage[]> {
  const messages = await loadMessages(conversationId, HISTORY_LIMIT)

  return messages.map(m => ({
    role: m.role,
    content: m.content,
  })) as ModelMessage[]
}

export async function shouldSummarize(conversationId: string): Promise<boolean> {
  const count = await getMessageCount(conversationId)
  return count >= SUMMARIZE_THRESHOLD
}

export { SUMMARIZE_THRESHOLD, HISTORY_LIMIT }
