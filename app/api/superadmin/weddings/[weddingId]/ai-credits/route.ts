import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { getAIBudgetStatus } from '@/lib/ai/credits'

export const dynamic = 'force-dynamic'

async function requireSuperadmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminSupabaseClient()
  if (!(await isSuperUser(admin, { email: user.email }))) return null
  return { user, admin }
}

// GET — budget status + optional usage logs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> },
) {
  const auth = await requireSuperadmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { weddingId } = await params

  if (req.nextUrl.searchParams.get('logs') === '1') {
    const { data: logs } = await auth.admin
      .from('ai_interaction_logs')
      .select('model, prompt_tokens, completion_tokens, estimated_cost, created_at')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ logs: logs ?? [] })
  }

  const status = await getAIBudgetStatus(weddingId)
  return NextResponse.json(status)
}

// POST — manually grant credits
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> },
) {
  const auth = await requireSuperadmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { weddingId } = await params
  const { amountCents, note } = await req.json()

  if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
    return NextResponse.json({ error: 'amountCents must be a positive number' }, { status: 400 })
  }

  // Record the manual grant
  await auth.admin.from('ai_credit_purchases').insert({
    wedding_id:    weddingId,
    amount_cents:  amountCents,
    status:        'completed',
    granted_by:    auth.user.id,
    note:          note ?? 'Manual grant by superadmin',
  })

  // Increment the budget
  await auth.admin.rpc('increment_ai_budget', { p_wedding_id: weddingId, p_cents: amountCents })

  return NextResponse.json({ ok: true })
}
