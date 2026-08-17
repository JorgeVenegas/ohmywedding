import { z } from 'zod'
import type { LLMTool, ToolContext } from '../types'

export const getWeddingInfo: LLMTool<Record<string, never>> = {
  name: 'get_wedding_info',
  description: 'Returns basic wedding information: date, venue, couple names, dress code, and general settings.',
  schema: z.object({}),
  roles: ['guest', 'couple', 'partner', 'planner', 'planner_staff', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    const { wedding, couple } = ctx.snapshot
    return {
      wedding: {
        name:       wedding.name,
        date:       wedding.date,
        venue:      wedding.venue,
        dress_code: wedding.dress_code,
        timezone:   wedding.timezone,
      },
      couple: {
        name1: couple.name1,
        name2: couple.name2,
      },
    }
  },
}
