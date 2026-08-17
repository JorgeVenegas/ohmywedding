import { generateText } from 'ai'
import { getModel } from '../providers'
import { selectModel } from '../providers/types'
import type { StoredMessage } from './storage'

export async function summarizeMessages(messages: StoredMessage[]): Promise<string> {
  if (messages.length === 0) return ''

  const transcript = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const config = selectModel('planner', 'simple')
  const model = getModel(config)

  const { text } = await generateText({
    model,
    prompt: `Summarize the following wedding planning conversation in 3-5 sentences. Capture key decisions, questions answered, and any open items.

${transcript}

Summary:`,
  })

  return text.trim()
}
