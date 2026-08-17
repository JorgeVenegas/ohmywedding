import { z } from 'zod'
import type { LLMTool, ToolContext } from '../types'

const schema = z.object({
  include_contact: z.boolean().default(false)
                    .describe('Include supplier contact info — only when the user asks for contact details'),
})

export const getVendorSummary: LLMTool<z.infer<typeof schema>> = {
  name: 'get_vendor_summary',
  description: 'Returns the list of wedding suppliers with their category, payment status (paid/partial/unpaid), contracted amount, amount paid, and outstanding balance. For detailed payment history, use get_payments instead.',
  schema,
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute({ include_contact }, ctx: ToolContext) {
    const vendors = ctx.snapshot.vendors.map(v => {
      const r: Record<string, unknown> = {
        name:         v.name,
        category:     v.category,
        status:       v.status,
        total_amount: v.total_amount,
        paid_amount:  v.paid_amount,
        remaining:    v.remaining,
      }
      if (include_contact && v.contact) r.contact = v.contact
      return r
    })
    return { vendors }
  },
}
