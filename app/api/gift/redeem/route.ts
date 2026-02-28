import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// DB-level lockout threshold — code is auto-expired after this many failed attempts
const MAX_REDEEM_ATTEMPTS = 10

// POST /api/gift/redeem - Redeem a gift code for a wedding
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { code, weddingId } = await request.json()

    if (!code || !weddingId) {
      return NextResponse.json({ error: 'Gift code and wedding ID are required' }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase().replace(/[-\s]/g, '')

    // Use admin client for transactional operations
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate the gift code
    const { data: gift, error: giftError } = await adminClient
      .from('gift_subscriptions')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (giftError || !gift) {
      // Code doesn't exist — return generic error (don't reveal whether code exists or not)
      return NextResponse.json({ error: 'Invalid gift code' }, { status: 404 })
    }

    // DB-level brute-force protection: if too many failed attempts, auto-expire
    if (gift.redeem_attempts >= MAX_REDEEM_ATTEMPTS && gift.status === 'active') {
      await adminClient
        .from('gift_subscriptions')
        .update({ status: 'expired' })
        .eq('id', gift.id)
      return NextResponse.json({ error: 'This gift code has been locked due to too many failed attempts. Please contact support.' }, { status: 429 })
    }

    // Check if already redeemed
    if (gift.status === 'redeemed' || gift.wedding_id) {
      return NextResponse.json({ error: 'This gift code has already been redeemed' }, { status: 400 })
    }

    // Check if expired
    if (gift.status === 'expired') {
      return NextResponse.json({ error: 'This gift code has expired' }, { status: 400 })
    }

    // Verify user owns the wedding
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, owner_id')
      .eq('id', weddingId)
      .single()

    if (weddingError || !wedding) {
      // Increment failed attempts for bad wedding ID (possible probing)
      await adminClient
        .from('gift_subscriptions')
        .update({ redeem_attempts: gift.redeem_attempts + 1, last_attempt_at: new Date().toISOString() })
        .eq('id', gift.id)
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    if (wedding.owner_id !== user.id) {
      await adminClient
        .from('gift_subscriptions')
        .update({ redeem_attempts: gift.redeem_attempts + 1, last_attempt_at: new Date().toISOString() })
        .eq('id', gift.id)
      return NextResponse.json({ error: 'You do not own this wedding' }, { status: 403 })
    }

    // Check if the wedding already has a paid plan
    const { data: existingSub } = await adminClient
      .from('wedding_subscriptions')
      .select('plan')
      .eq('wedding_id', weddingId)
      .single()

    if (existingSub && existingSub.plan !== 'free') {
      return NextResponse.json(
        { error: 'This wedding already has a paid plan' },
        { status: 400 }
      )
    }

    // Redeem: upsert wedding_subscription + update gift_subscription
    const { error: subError } = await adminClient
      .from('wedding_subscriptions')
      .upsert({
        wedding_id: weddingId,
        plan: gift.plan,
      }, {
        onConflict: 'wedding_id',
      })

    if (subError) {
      return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 })
    }

    const { error: redeemError } = await adminClient
      .from('gift_subscriptions')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: user.id,
        wedding_id: weddingId,
      })
      .eq('id', gift.id)
      .eq('status', 'active') // Extra safety: only update if still active

    if (redeemError) {
      return NextResponse.json({ error: 'Failed to redeem gift code' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      plan: gift.plan,
      message: `Successfully redeemed ${gift.plan} plan!`,
    })

  } catch (error) {
    console.error('Gift redeem error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper to generate a secure gift code
export function generateGiftCode(): string {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16).toUpperCase()
}
