import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Check superadmin
    const { data: isSuperuser } = await supabaseAdmin
      .from('superusers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!isSuperuser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query params
    const { searchParams } = request.nextUrl
    const from = searchParams.get('from')   // ISO date
    const to = searchParams.get('to')       // ISO date
    const plan = searchParams.get('plan')   // premium | deluxe
    const source = searchParams.get('source')

    // Build base query — need source, to_plan, status, and amount for revenue
    let query = supabaseAdmin
      .from('subscription_orders')
      .select('source, to_plan, status, amount_cents')

    if (from) query = query.gte('visited_at', from)
    if (to) query = query.lte('visited_at', to)
    if (plan) query = query.eq('to_plan', plan)
    if (source) query = query.eq('source', source)

    const { data: leads, error: fetchError } = await query

    if (fetchError) throw fetchError

    const allLeads = leads || []

    // Define the ordered funnel stages — each order is counted at its
    // CURRENT status only, so completed orders don't inflate requires_action.
    const STATUS_LEVEL: Record<string, number> = {
      visited: 0,
      checkout_started: 1,
      requires_action: 2,
      completed: 3,
      failed: -1,
      expired: -1,
      refunded: -1,
      abandoned: -1,
    }

    // Overall funnel stats — count orders that reached AT LEAST each stage
    // (a completed order passed through all prior stages)
    const funnel = {
      visited: allLeads.length,
      checkout_started: allLeads.filter(l => STATUS_LEVEL[l.status] >= 1).length,
      requires_action: allLeads.filter(l => STATUS_LEVEL[l.status] >= 2).length,
      completed: allLeads.filter(l => l.status === 'completed').length,
      failed: allLeads.filter(l => l.status === 'failed').length,
    }

    // Per-source breakdown
    const sourceMap = new Map<string, {
      source: string
      visited: number
      checkout_started: number
      requires_action: number
      completed: number
      failed: number
      revenue_cents: number
    }>()

    for (const lead of allLeads) {
      const src = lead.source || 'unknown'
      if (!sourceMap.has(src)) {
        sourceMap.set(src, {
          source: src,
          visited: 0,
          checkout_started: 0,
          requires_action: 0,
          completed: 0,
          failed: 0,
          revenue_cents: 0,
        })
      }
      const entry = sourceMap.get(src)!
      const level = STATUS_LEVEL[lead.status] ?? 0
      entry.visited++
      if (level >= 1) entry.checkout_started++
      if (level >= 2) entry.requires_action++
      if (lead.status === 'completed') {
        entry.completed++
        entry.revenue_cents += lead.amount_cents ?? 0
      }
      if (lead.status === 'failed') entry.failed++
    }

    // Sort sources by visited count descending
    const sources = Array.from(sourceMap.values()).sort((a, b) => b.visited - a.visited)

    // Per-plan breakdown with all statuses
    const planMap = new Map<string, {
      plan: string
      visited: number
      checkout_started: number
      requires_action: number
      completed: number
      failed: number
      revenue_cents: number
    }>()
    for (const lead of allLeads) {
      const p = lead.to_plan || 'undecided'
      if (!planMap.has(p)) {
        planMap.set(p, {
          plan: p,
          visited: 0,
          checkout_started: 0,
          requires_action: 0,
          completed: 0,
          failed: 0,
          revenue_cents: 0,
        })
      }
      const entry = planMap.get(p)!
      const level = STATUS_LEVEL[lead.status] ?? 0
      entry.visited++
      if (level >= 1) entry.checkout_started++
      if (level >= 2) entry.requires_action++
      if (lead.status === 'completed') {
        entry.completed++
        entry.revenue_cents += lead.amount_cents ?? 0
      }
      if (lead.status === 'failed') entry.failed++
    }
    const plans = Array.from(planMap.values()).sort((a, b) => b.visited - a.visited)

    return NextResponse.json({ funnel, sources, plans })
  } catch (err) {
    console.error('Failed to fetch funnel data:', err)
    return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 })
  }
}
