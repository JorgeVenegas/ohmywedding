import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({
  guest_name: z.string().describe('Name of the guest to update (partial match is fine)'),
  note: z.string().describe('The note to set on the guest record'),
})

export const updateGuestNote: LLMTool<z.infer<typeof schema>> = {
  name: 'update_guest_note',
  description: 'Updates the internal notes field on a guest record. Use when the user wants to save a note or reminder about a specific guest.',
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute({ guest_name, note }, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()

    const { data, error } = await admin
      .from('guests')
      .update({ notes: note })
      .eq('wedding_id', ctx.weddingId)
      .ilike('name', `%${guest_name}%`)
      .select('name')

    if (error) {
      return { success: false, error: 'Failed to update guest note' }
    }

    if (!data || data.length === 0) {
      return { success: false, error: `No guest found matching "${guest_name}"` }
    }

    return {
      success: true,
      updated: data.map(g => g.name),
      message: `Note updated for ${data.map(g => g.name).join(', ')}`,
    }
  },
}
