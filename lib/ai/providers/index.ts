import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import type { ProviderConfig } from './types'

export function getModel(config: ProviderConfig) {
  switch (config.provider) {
    case 'anthropic':
      return anthropic(config.model)
    case 'openai':
    default:
      return openai(config.model)
  }
}

export function resolveModel(config: ProviderConfig) {
  return getModel(config)
}
