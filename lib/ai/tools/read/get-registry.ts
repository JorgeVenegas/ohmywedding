import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({})

export const getRegistry: LLMTool<z.infer<typeof schema>> = {
  name: 'get_registry',
  description: `Returns the wedding registry: custom gift items with their fundraising goals and amounts raised, plus any linked external registries (e.g. store wishlists).
Call this when the user asks about gifts, registry, contributions, fundraising goals, or how much has been raised.`,
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()
    const slug = ctx.snapshot.wedding.slug

    const [{ data: customItems }, { data: giftRegistries }, { data: contributions }] =
      await Promise.all([
        admin
          .from('custom_registry_items')
          .select('title, description, goal_amount, current_amount, is_active')
          .eq('wedding_name_id', slug)
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        admin
          .from('gift_registries')
          .select('registry_name, store_name, registry_url, description')
          .eq('wedding_name_id', slug)
          .order('display_order', { ascending: true }),
        admin
          .from('registry_contributions')
          .select('amount, payment_status')
          .eq('wedding_name_id', slug)
          .eq('payment_status', 'paid'),
      ])

    const totalGoal = (customItems ?? []).reduce((s, i) => s + Number(i.goal_amount), 0)
    const totalRaised = (customItems ?? []).reduce((s, i) => s + Number(i.current_amount), 0)

    return {
      summary: {
        total_items: (customItems ?? []).length,
        total_goal: totalGoal,
        total_raised: totalRaised,
        total_contributions: (contributions ?? []).length,
        external_registries: (giftRegistries ?? []).length,
      },
      items: (customItems ?? []).map(i => ({
        title: i.title,
        description: i.description,
        goal: Number(i.goal_amount),
        raised: Number(i.current_amount),
        percent: i.goal_amount > 0
          ? Math.round((Number(i.current_amount) / Number(i.goal_amount)) * 100)
          : 0,
      })),
      external_registries: (giftRegistries ?? []).map(r => ({
        name: r.registry_name,
        store: r.store_name,
        url: r.registry_url,
        description: r.description,
      })),
    }
  },
}
