import { z } from 'zod'
import type { LLMTool, ToolContext } from '../types'

export const getGuestSummary: LLMTool<Record<string, never>> = {
  name: 'get_guest_summary',
  description: 'Returns RSVP counts: total guests, how many confirmed (said YES), pending (no response yet), declined (said NO), and dietary restrictions summary. Use this for counts only. For individual guest names, call get_guest_list.',
  schema: z.object({}),
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    const g = ctx.snapshot.guests
    const result: Record<string, unknown> = {
      total:     g.total,
      confirmed: g.accepted,
      pending:   g.pending,
      declined:  g.declined,
    }
    // Only include dietary summary if at least one restriction exists
    const dietary = g.dietary_summary ?? {}
    if (Object.keys(dietary).length > 0) result.dietary_restrictions = dietary
    return result
  },
}
