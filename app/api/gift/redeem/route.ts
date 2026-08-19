import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_REDEEM_ATTEMPTS = 10

type PlanInfo = { axis: 'invitation' | 'management'; tier: string }

function getPlanInfo(plan: string): PlanInfo | null {
  switch (plan) {
    case 'invitation_basic':  return { axis: 'invitation', tier: 'basic'        }
    case 'premium':           return { axis: 'invitation', tier: 'personalized' }
    case 'deluxe':            return { axis: 'invitation', tier: 'bespoke'      }
    case 'management_basic':  return { axis: 'management', tier: 'basic'        }
    case 'management_pro':    return { axis: 'management', tier: 'pro'          }
    case 'management_agency': return { axis: 'management', tier: 'agency'       }
    default:                  return null
  }
}

// POST /api/gift/redeem - Redeem a gift code for a wedding
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { code, weddingId } = await request.json()

    if (!code || !weddingId) {
      return NextResponse.json({ error: 'Gift code and wedding ID are required' }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase().replace(/[-\s]/g, '')

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: gift, error: giftError } = await adminClient
      .from('gift_subscriptions')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (giftError || !gift) {
      return NextResponse.json({ error: 'Invalid gift code' }, { status: 404 })
    }

    if (gift.redeem_attempts >= MAX_REDEEM_ATTEMPTS && gift.status === 'active') {
      await adminClient
        .from('gift_subscriptions')
        .update({ status: 'expired' })
        .eq('id', gift.id)
      return NextResponse.json({ error: 'This gift code has been locked due to too many failed attempts. Please contact support.' }, { status: 429 })
    }

    if (gift.status === 'redeemed' || gift.wedding_id) {
      return NextResponse.json({ error: 'This gift code has already been redeemed' }, { status: 400 })
    }

    if (gift.status === 'expired') {
      return NextResponse.json({ error: 'This gift code has expired' }, { status: 400 })
    }

    const planInfo = getPlanInfo(gift.plan)
    if (!planInfo) {
      return NextResponse.json({ error: 'Invalid gift plan type' }, { status: 500 })
    }

    // Verify user owns the wedding
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, owner_id')
      .eq('id', weddingId)
      .single()

    if (weddingError || !wedding) {
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

    // Check whether this axis is already upgraded
    const { data: existingSub } = await adminClient
      .from('wedding_subscriptions')
      .select('invitation_tier, management_tier')
      .eq('wedding_id', weddingId)
      .single()

    if (planInfo.axis === 'invitation') {
      const currentInv = existingSub?.invitation_tier
      if (currentInv && currentInv !== 'basic') {
        return NextResponse.json({ error: 'This wedding already has a paid invitation plan' }, { status: 400 })
      }
    } else {
      const currentMgmt = existingSub?.management_tier
      if (currentMgmt && currentMgmt !== 'basic') {
        return NextResponse.json({ error: 'This wedding already has a paid management plan' }, { status: 400 })
      }
    }

    // Activate: upsert the appropriate axis tier
    const tierUpdate =
      planInfo.axis === 'invitation'
        ? { invitation_tier: planInfo.tier }
        : { management_tier: planInfo.tier }

    const { error: subError } = await adminClient
      .from('wedding_subscriptions')
      .upsert({ wedding_id: weddingId, ...tierUpdate }, { onConflict: 'wedding_id' })

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
      .eq('status', 'active')

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

export function generateGiftCode(): string {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16).toUpperCase()
}
