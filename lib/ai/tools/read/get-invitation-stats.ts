import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({})

export const getInvitationStats: LLMTool<z.infer<typeof schema>> = {
  name: 'get_invitation_stats',
  description: `Returns invitation delivery and open statistics: how many invitations were sent, how many guest groups opened their invitation, and the open rate.
Call this when the user asks about invitation opens, who has opened the invitation, send status, or invitation engagement.`,
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()

    const [{ data: groups }, { data: opens }] = await Promise.all([
      admin
        .from('guest_groups')
        .select('id, name, invitation_sent, invitation_sent_at')
        .eq('wedding_id', ctx.weddingId),
      admin
        .from('invitation_opens')
        .select('guest_group_id, opened_at, device_type, country')
        .eq('wedding_id', ctx.weddingId)
        .eq('is_owner_view', false),
    ])

    const allGroups = groups ?? []
    const allOpens = opens ?? []

    const sentGroups = allGroups.filter(g => g.invitation_sent)
    const openedGroupIds = new Set(allOpens.map(o => o.guest_group_id))

    // Use all groups as base — opened/not-opened is driven by actual opens, not the sent flag
    const groupsThatOpened = allGroups.filter(g => openedGroupIds.has(g.id))
    const groupsNotOpened = allGroups.filter(g => !openedGroupIds.has(g.id))

    // Device breakdown
    const deviceCounts: Record<string, number> = {}
    for (const o of allOpens) {
      const d = o.device_type ?? 'unknown'
      deviceCounts[d] = (deviceCounts[d] ?? 0) + 1
    }

    return {
      summary: {
        total_groups: allGroups.length,
        invitations_sent: sentGroups.length,
        invitations_pending: allGroups.length - sentGroups.length,
        groups_opened: groupsThatOpened.length,
        groups_not_opened: groupsNotOpened.length,
        open_rate_percent: allGroups.length > 0
          ? Math.round((groupsThatOpened.length / allGroups.length) * 100)
          : 0,
        total_opens: allOpens.length,
      },
      not_opened: groupsNotOpened.map(g => ({ name: g.name, sent_at: g.invitation_sent_at })),
      device_breakdown: deviceCounts,
    }
  },
}
