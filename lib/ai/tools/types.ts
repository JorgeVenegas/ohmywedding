import type { AIRole } from '../auth/types'
import type { AIWeddingSnapshot } from '../context/types'
import { z } from 'zod'

export interface ToolContext {
  weddingId: string
  role: AIRole
  snapshot: AIWeddingSnapshot
}

export interface LLMTool<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string
  description: string
  schema: z.ZodTypeAny
  roles: AIRole[]
  execute: (input: TInput, ctx: ToolContext) => Promise<TOutput>
}
