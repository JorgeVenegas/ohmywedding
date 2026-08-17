import { z } from 'zod'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({
  include_notes: z.boolean().default(false)
                  .describe('Include event notes/details — only when user asks for specifics about each event'),
})

export const getTimeline: LLMTool<z.infer<typeof schema>> = {
  name: 'get_timeline',
  description: 'Returns the wedding day timeline / itinerary: time, event name, and location for each item.',
  schema,
  roles: ['guest', 'couple', 'partner', 'planner', 'planner_staff', 'superadmin'],
  async execute({ include_notes }, ctx: ToolContext) {
    const events = ctx.snapshot.timeline
    const visible = ctx.role === 'guest' ? events.filter(e => e.is_public !== false) : events
    return {
      timeline: visible.map(e => {
        const r: Record<string, unknown> = { time: e.time, title: e.title }
        if (e.location)               r.location = e.location
        if (include_notes && e.notes) r.notes    = e.notes
        return r
      }),
    }
  },
}
