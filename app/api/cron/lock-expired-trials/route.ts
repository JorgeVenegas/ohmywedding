import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron: run hourly
// Finds weddings with no paid plan whose 24-hour trial has expired
// and sets is_locked = true on them.

export async function POST(request: NextRequest) {
  // Protect with cron secret so only Vercel Cron (or authorized callers) can trigger
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find weddings with no subscription (or plan = 'none') created more than 24h ago
  // that are not yet locked
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Get wedding IDs that have a paid subscription (exclude from locking)
  const { data: paidWeddingIds } = await supabase
    .from('wedding_subscriptions')
    .select('wedding_id')
    .not('plan', 'in', '("none")')

  const excludeIds = (paidWeddingIds ?? []).map((r: { wedding_id: string }) => r.wedding_id)

  // Find unlocked weddings older than 24h with no paid plan
  let query = supabase
    .from('weddings')
    .select('id, wedding_name_id, created_at')
    .eq('is_locked', false)
    .lt('created_at', cutoff)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.map((id: string) => `"${id}"`).join(',')})`)
  }

  const { data: expiredWeddings, error: fetchError } = await query

  if (fetchError) {
    console.error('[cron/lock-expired-trials] fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!expiredWeddings || expiredWeddings.length === 0) {
    return NextResponse.json({ locked: 0, message: 'No expired trials found' })
  }

  const ids = expiredWeddings.map((w: { id: string }) => w.id)

  const { error: updateError } = await supabase
    .from('weddings')
    .update({ is_locked: true, locked_at: new Date().toISOString() })
    .in('id', ids)

  if (updateError) {
    console.error('[cron/lock-expired-trials] update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  console.log(`[cron/lock-expired-trials] Locked ${ids.length} expired trial weddings`)
  return NextResponse.json({
    locked: ids.length,
    weddings: expiredWeddings.map((w: { id: string; wedding_name_id: string; created_at: string }) => ({
      id: w.id,
      weddingNameId: w.wedding_name_id,
      createdAt: w.created_at,
    })),
  })
}
