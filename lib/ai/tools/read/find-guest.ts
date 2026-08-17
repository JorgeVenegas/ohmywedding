import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({
  query: z.string().describe('Name, phone number, or partial string to search for'),
})

export const findGuest: LLMTool<z.infer<typeof schema>> = {
  name: 'find_guest',
  description: 'Search for a specific guest by name or phone number.',
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute({ query }, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()
    const { data } = await admin
      .from('guests')
      .select('name, confirmation_status, dietary_restrictions, phone_number, notes')
      .eq('wedding_id', ctx.weddingId)
      .or(`name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .limit(10)

    // Strip null fields so the LLM only sees populated values
    const guests = (data ?? []).map(g => {
      const r: Record<string, unknown> = { name: g.name, status: g.confirmation_status }
      if (g.dietary_restrictions) r.dietary_restrictions = g.dietary_restrictions
      if (g.phone_number)         r.phone = g.phone_number
      if (g.notes)                r.notes = g.notes
      return r
    })
    return { guests }
  },
}
