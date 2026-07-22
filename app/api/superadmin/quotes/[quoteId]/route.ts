import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION as any })

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function verifySuperadmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!(await isSuperUser(supabase, { userId: user.id })))
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

// GET /api/superadmin/quotes/[quoteId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params
    const supabase = await createServerSupabaseClient()
    const { error: authError } = await verifySuperadmin(supabase)
    if (authError) return authError

    const admin = createAdminSupabaseClient()
    const { data: quote, error } = await admin
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (error || !quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    return NextResponse.json({ quote })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/superadmin/quotes/[quoteId]
// Accepts: { status?, weddingId? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params
    const supabase = await createServerSupabaseClient()
    const { error: authError } = await verifySuperadmin(supabase)
    if (authError) return authError

    const body = await request.json()
    const allowed = ['draft', 'sent', 'viewed', 'paid', 'expired', 'cancelled']
    const updates: Record<string, unknown> = {}

    if (body.status !== undefined) {
      if (!allowed.includes(body.status))
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      updates.status = body.status
    }
    if (body.weddingId !== undefined) updates.wedding_id = body.weddingId
    if (body.language !== undefined) {
      if (!['en', 'es'].includes(body.language))
        return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
      updates.language = body.language
    }

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    const admin = createAdminSupabaseClient()

    // When cancelling a quote, expire its coupon in Stripe and mark it inactive
    if (updates.status === 'cancelled') {
      const { data: existingQuote } = await admin
        .from('quotes')
        .select('coupon_id')
        .eq('id', quoteId)
        .single()

      if (existingQuote?.coupon_id) {
        const { data: coupon } = await admin
          .from('coupons')
          .select('stripe_coupon_id')
          .eq('id', existingQuote.coupon_id)
          .single()

        if (coupon?.stripe_coupon_id) {
          try {
            await getStripe().coupons.del(coupon.stripe_coupon_id)
          } catch (err) {
            // Coupon may already be deleted; log and continue
            console.error('[quote cancel] Failed to delete Stripe coupon:', err)
          }
        }

        await admin
          .from('coupons')
          .update({ is_active: false })
          .eq('id', existingQuote.coupon_id)
      }
    }

    const { data: quote, error } = await admin
      .from('quotes')
      .update(updates)
      .eq('id', quoteId)
      .select()
      .single()

    if (error || !quote) return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 })
    return NextResponse.json({ quote })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
