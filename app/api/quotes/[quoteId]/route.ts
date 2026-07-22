// Public quote API — no auth required (UUID-as-capability-token pattern)
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/quotes/[quoteId] — fetch quote by ID and mark as viewed
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params
    const admin = createAdminSupabaseClient()

    const { data: quote, error } = await admin
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (error || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Advance status from sent → viewed once
    if (quote.status === 'sent') {
      await admin
        .from('quotes')
        .update({ status: 'viewed' })
        .eq('id', quoteId)
      quote.status = 'viewed'
    }

    return NextResponse.json({ quote })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
