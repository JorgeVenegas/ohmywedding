import { createAdminSupabaseClient } from '@/lib/supabase-server'

export interface InteractionLog {
  userId: string | null
  weddingId: string
  conversationId: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  toolsCalled: string[]
  durationMs: number
  error?: string
}

// Cost per 1M tokens (approximate, updated for Claude Haiku/Sonnet)
const COST_PER_M: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
}

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const rates = COST_PER_M[model] ?? { input: 3.0, output: 15.0 }
  return (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output
}

export async function logInteraction(log: InteractionLog): Promise<void> {
  const admin = createAdminSupabaseClient()
  const cost = estimateCost(log.model, log.promptTokens, log.completionTokens)

  await admin.from('ai_interaction_logs').insert({
    user_id: log.userId,
    wedding_id: log.weddingId,
    conversation_id: log.conversationId,
    model: log.model,
    prompt_tokens: log.promptTokens,
    completion_tokens: log.completionTokens,
    total_tokens: log.totalTokens,
    estimated_cost: cost,
    tools_called: log.toolsCalled,
    duration_ms: log.durationMs,
    error: log.error ?? null,
  })
}
