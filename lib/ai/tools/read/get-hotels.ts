import { z } from 'zod'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({
  include_address: z.boolean().default(false)
                    .describe('Include hotel address — only when user asks for location/directions'),
  include_contact: z.boolean().default(false)
                    .describe('Include hotel contact info — only when user needs to reach the hotel'),
  include_notes:   z.boolean().default(false)
                    .describe('Include hotel notes — only when user asks for additional details'),
})

export const getHotels: LLMTool<z.infer<typeof schema>> = {
  name: 'get_hotels',
  description: 'Returns the list of recommended hotels and accommodations for wedding guests.',
  schema,
  roles: ['guest', 'couple', 'partner', 'planner', 'planner_staff', 'superadmin'],
  async execute({ include_address, include_contact, include_notes }, ctx: ToolContext) {
    const hotels = ctx.snapshot.hotels.map(h => {
      const r: Record<string, unknown> = { name: h.name }
      if (include_address && h.address) r.address = h.address
      if (include_contact && h.contact) r.contact = h.contact
      if (include_notes   && h.notes)   r.notes   = h.notes
      return r
    })
    return { hotels }
  },
}
