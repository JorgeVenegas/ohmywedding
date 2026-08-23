import { createAdminSupabaseClient } from '@/lib/supabase-server'

export type { CreditPackage } from '@/lib/ai/credit-packages'
export { AI_CREDIT_PACKAGES } from '@/lib/ai/credit-packages'

export interface AIBudgetStatus {
  budgetCents:    number
  usedCents:      number
  remainingCents: number
  isExhausted:    boolean
  usagePct:       number | null  // null when budget is 0 (avoid division by zero display)
}

export async function getAIBudgetStatus(weddingId: string): Promise<AIBudgetStatus> {
  const admin = createAdminSupabaseClient()

  const [{ data: wedding }, { data: logs }] = await Promise.all([
    admin.from('weddings').select('ai_budget_cents').eq('id', weddingId).single(),
    admin.from('ai_interaction_logs').select('estimated_cost').eq('wedding_id', weddingId),
  ])

  const budgetCents = wedding?.ai_budget_cents ?? 0
  const totalCostUsd = (logs ?? []).reduce((sum, row) => sum + Number(row.estimated_cost ?? 0), 0)
  const usedCents = Math.round(totalCostUsd * 100)

  const remainingCents = Math.max(0, budgetCents - usedCents)
  return {
    budgetCents,
    usedCents,
    remainingCents,
    isExhausted: budgetCents > 0 && usedCents >= budgetCents,
    usagePct: budgetCents > 0 ? Math.min(100, Math.round((usedCents / budgetCents) * 100)) : null,
  }
}

/** Grant additional credits to a wedding (call after Stripe payment or manual grant). */
export async function grantCredits(weddingId: string, amountCents: number): Promise<void> {
  const admin = createAdminSupabaseClient()
  await admin.rpc('increment_ai_budget', { p_wedding_id: weddingId, p_cents: amountCents })
}
