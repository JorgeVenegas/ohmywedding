import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

export const getBudget: LLMTool<Record<string, never>> = {
  name: 'get_budget',
  description: 'Returns the live wedding budget overview: total contracted amount across all suppliers, total paid, and remaining balance. Always use this for budget questions to get the most up-to-date figures.',
  schema: z.object({}),
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()

    const [suppliersRes, paymentsRes] = await Promise.all([
      admin.from('suppliers').select('total_amount').eq('wedding_id', ctx.weddingId),
      admin.from('supplier_payments').select('amount').eq('wedding_id', ctx.weddingId),
    ])

    const total = (suppliersRes.data ?? []).reduce((s, r) => s + Number(r.total_amount ?? 0), 0)
    const spent = (paymentsRes.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0)

    return {
      total_contracted: total,
      total_paid:       spent,
      total_remaining:  total - spent,
      paid_pct:         total > 0 ? Math.round((spent / total) * 100) : 0,
      currency:         ctx.snapshot.budget?.currency ?? 'USD',
    }
  },
}
