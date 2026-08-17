import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({
  status:          z.enum(['confirmed', 'declined', 'pending', 'all']).default('all')
                    .describe('Filter by RSVP status'),
  limit:           z.number().min(1).max(200).default(100)
                    .describe('Maximum guests to return'),
  include_phone:   z.boolean().default(false)
                    .describe('Include phone numbers — only when the user asks for contact info'),
  include_dietary: z.boolean().default(false)
                    .describe('Include dietary restrictions — only when the user asks about food/allergies'),
  include_notes:   z.boolean().default(false)
                    .describe('Include guest notes — only when the user asks for additional details'),
})

export const getGuestList: LLMTool<z.infer<typeof schema>> = {
  name: 'get_guest_list',
  description: `Returns wedding guest names filtered by RSVP status.
Status values:
  "confirmed" = said YES (confirmados, asistirán)
  "pending"   = no response yet (pendientes, sin confirmar)
  "declined"  = said NO (declinaron, no asistirán, no van a ir)
Returns names only by default. Set include_phone/include_dietary/include_notes only when the user explicitly needs those fields.`,
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute({ status, limit, include_phone, include_dietary, include_notes }, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()

    const selectFields = [
      'name',
      include_phone   ? 'phone_number'         : null,
      include_dietary ? 'dietary_restrictions'  : null,
      include_notes   ? 'notes'                 : null,
    ].filter(Boolean).join(', ')

    let query = admin
      .from('guests')
      .select(selectFields)
      .eq('wedding_id', ctx.weddingId)
      .limit(limit)
      .order('name', { ascending: true })

    if (status !== 'all') query = query.eq('confirmation_status', status)

    const { data } = await query

    // Strip null/empty optional fields so the JSON stays small
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guests = (data ?? []).map((g: any) => {
      const r: Record<string, unknown> = { name: g.name }
      if (include_phone   && g.phone_number)        r.phone   = g.phone_number
      if (include_dietary && g.dietary_restrictions) r.dietary = g.dietary_restrictions
      if (include_notes   && g.notes)               r.notes   = g.notes
      return r
    })

    return { guests, total: guests.length, status_filter: status }
  },
}
