import { z } from 'zod'
import type { LLMTool, ToolContext } from '../types'

export const getFaq: LLMTool<Record<string, never>> = {
  name: 'get_faq',
  description: 'Returns the wedding FAQ entries — common questions and answers configured by the couple.',
  schema: z.object({}),
  roles: ['guest', 'couple', 'partner', 'planner', 'planner_staff', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    return { faq: ctx.snapshot.faq }
  },
}
