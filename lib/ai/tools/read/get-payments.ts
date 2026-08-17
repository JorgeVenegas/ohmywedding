import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { LLMTool, ToolContext } from '../types'

export const getPayments: LLMTool<Record<string, never>> = {
  name: 'get_payments',
  description:
    'Returns a live per-supplier payment breakdown: contracted amount, amount paid, outstanding balance, and payment history for each supplier. ' +
    'Use this whenever the user asks about pending payments, missing payments, what still needs to be paid, or supplier balances.',
  schema: z.object({}),
  roles: ['couple', 'partner', 'planner', 'superadmin'],
  async execute(_input, ctx: ToolContext) {
    const admin = createAdminSupabaseClient()

    const [suppliersRes, paymentsRes] = await Promise.all([
      admin
        .from('suppliers')
        .select('id, name, category, total_amount, notes')
        .eq('wedding_id', ctx.weddingId)
        .order('name'),
      admin
        .from('supplier_payments')
        .select('supplier_id, amount, payment_date, notes')
        .eq('wedding_id', ctx.weddingId)
        .order('payment_date', { ascending: false }),
    ])

    const suppliers = suppliersRes.data ?? []
    const payments  = paymentsRes.data ?? []

    // Index payments by supplier
    const paymentsBySupplier: Record<string, Array<{ amount: number; date: string; notes?: string }>> = {}
    for (const p of payments) {
      if (!paymentsBySupplier[p.supplier_id]) paymentsBySupplier[p.supplier_id] = []
      paymentsBySupplier[p.supplier_id].push({
        amount: Number(p.amount),
        date:   p.payment_date,
        notes:  p.notes ?? undefined,
      })
    }

    const breakdown = suppliers.map(s => {
      const supplierPayments = paymentsBySupplier[s.id] ?? []
      const total     = Number(s.total_amount ?? 0)
      const paid      = supplierPayments.reduce((sum, p) => sum + p.amount, 0)
      const remaining = total - paid
      const status    = remaining <= 0 ? 'fully_paid' : paid > 0 ? 'partially_paid' : 'unpaid'
      const entry: Record<string, unknown> = {
        name:         s.name,
        category:     s.category,
        total_amount: total,
        paid_amount:  paid,
        remaining,
        status,
      }
      // Only include payment history and notes if they have content
      if (supplierPayments.length > 0) {
        entry.payments = supplierPayments.map(p => {
          const r: Record<string, unknown> = { amount: p.amount, date: p.date }
          if (p.notes) r.notes = p.notes
          return r
        })
      }
      if (s.notes) entry.notes = s.notes
      return entry
    })

    const totalContracted = breakdown.reduce((s, b) => s + (b.total_amount as number), 0)
    const totalPaid       = breakdown.reduce((s, b) => s + (b.paid_amount as number), 0)

    return {
      summary: {
        total_contracted:  totalContracted,
        total_paid:        totalPaid,
        total_remaining:   totalContracted - totalPaid,
        suppliers_unpaid:  breakdown.filter(b => b.status === 'unpaid').length,
        suppliers_partial: breakdown.filter(b => b.status === 'partially_paid').length,
        suppliers_paid:    breakdown.filter(b => b.status === 'fully_paid').length,
      },
      pending:    breakdown.filter(b => b.status !== 'fully_paid'),
      fully_paid: breakdown.filter(b => b.status === 'fully_paid').map(b => ({ name: b.name, category: b.category })),
    }
  },
}
