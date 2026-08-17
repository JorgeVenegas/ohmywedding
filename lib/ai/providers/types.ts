import type { AIRole } from '../auth/types'

export type ModelComplexity = 'simple' | 'complex'

export type ProviderName = 'openai' | 'anthropic'

export interface ProviderConfig {
  model: string
  provider: ProviderName
}

export function selectModel(_role: AIRole, complexity: ModelComplexity): ProviderConfig {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  if (!hasAnthropic && !hasOpenAI) {
    throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.')
  }

  // Anthropic takes priority when both keys are present
  if (hasAnthropic) {
    if (complexity === 'simple') return { model: 'claude-haiku-4-5-20251001', provider: 'anthropic' }
    return { model: 'claude-sonnet-4-6', provider: 'anthropic' }
  }

  if (complexity === 'simple') return { model: 'gpt-4o-mini', provider: 'openai' }
  return { model: 'gpt-4o', provider: 'openai' }
}
