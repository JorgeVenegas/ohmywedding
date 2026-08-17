import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({})

export const getSeating: LLMTool<z.infer<typeof schema>> = {
  name: 'get_seating',
  description: `Returns the seating chart: all tables with their capacity, shape, and how many guests are assigned to each.
Call this when the user asks about tables, seating, seat assignments, or the floor plan.`,
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()

    const [{ data: tables }, { data: assignments }] = await Promise.all([
      admin
        .from('seating_tables')
        .select('id, name, shape, capacity')
        .eq('wedding_id', ctx.weddingId)
        .order('display_order', { ascending: true }),
      admin
        .from('seating_assignments')
        .select('table_id')
        .eq('wedding_id', ctx.weddingId),
    ])

    const countsByTable: Record<string, number> = {}
    for (const a of assignments ?? []) {
      countsByTable[a.table_id] = (countsByTable[a.table_id] ?? 0) + 1
    }

    const totalSeated = Object.values(countsByTable).reduce((s, n) => s + n, 0)
    const totalCapacity = (tables ?? []).reduce((s, t) => s + t.capacity, 0)

    return {
      summary: {
        total_tables: tables?.length ?? 0,
        total_capacity: totalCapacity,
        guests_seated: totalSeated,
        guests_unassigned: (ctx.snapshot.guests.total ?? 0) - totalSeated,
      },
      tables: (tables ?? []).map(t => ({
        name: t.name,
        shape: t.shape,
        capacity: t.capacity,
        guests_assigned: countsByTable[t.id] ?? 0,
        available_seats: t.capacity - (countsByTable[t.id] ?? 0),
      })),
    }
  },
}
