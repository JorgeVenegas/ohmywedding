import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION as any })

async function verifySuperadmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: superuser } = await supabase
    .from('superusers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!superuser) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

// GET /api/superadmin/coupons/[couponId] - Get a single coupon with all details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { error: authError } = await verifySuperadmin(supabase)
    if (authError) return authError

    const { couponId } = await params

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select(`
        *,
        coupon_promotion_codes(*),
        coupon_redemptions(
          *,
          weddings:wedding_id(id, partner1_first_name, partner2_first_name, wedding_name_id),
          subscription_orders:subscription_order_id(id, amount_cents, status, stripe_payment_intent_id)
        )
      `)
      .eq('id', couponId)
      .single()

    if (error || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({ coupon })
  } catch (err) {
    console.error('Error in GET coupon:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/superadmin/coupons/[couponId] - Update coupon (toggle active, update name/metadata)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { user, error: authError } = await verifySuperadmin(supabase)
    if (authError || !user) return authError!

    const { couponId } = await params
    const body = await request.json()
    const { isActive, name } = body

    // Get current coupon
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*, coupon_promotion_codes(stripe_promotion_code_id)')
      .eq('id', couponId)
      .single()

    if (fetchError || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    const stripe = getStripe()
    const oldValues: Record<string, any> = {}
    const newValues: Record<string, any> = {}
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    // Update name on Stripe (Stripe allows updating coupon name)
    if (name !== undefined && name !== coupon.name) {
      await stripe.coupons.update(coupon.stripe_coupon_id, { name })
      oldValues.name = coupon.name
      newValues.name = name
      updates.name = name
    }

    // Toggle active status
    if (isActive !== undefined && isActive !== coupon.is_active) {
      oldValues.is_active = coupon.is_active
      newValues.is_active = isActive

      if (!isActive) {
        // Deactivate: delete coupon on Stripe (this prevents further use but keeps history)
        // Alternatively, deactivate all promotion codes
        for (const pc of coupon.coupon_promotion_codes || []) {
          try {
            await stripe.promotionCodes.update(pc.stripe_promotion_code_id, { active: false })
          } catch (e) {
            console.error('Error deactivating promo code on Stripe:', e)
          }
        }
        // Also deactivate all local promo codes
        await supabase
          .from('coupon_promotion_codes')
          .update({ is_active: false })
          .eq('coupon_id', couponId)
      } else {
        // Reactivate promotion codes
        for (const pc of coupon.coupon_promotion_codes || []) {
          try {
            await stripe.promotionCodes.update(pc.stripe_promotion_code_id, { active: true })
          } catch (e) {
            console.error('Error reactivating promo code on Stripe:', e)
          }
        }
        await supabase
          .from('coupon_promotion_codes')
          .update({ is_active: true })
          .eq('coupon_id', couponId)
      }

      updates.is_active = isActive
    }

    // Apply local DB update
    const { error: updateError } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', couponId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
    }

    // Log activity
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabase.from('superuser_activity_logs').insert({
      superuser_id: user.id,
      action_type: isActive !== undefined ? 'coupon_toggled' : 'coupon_updated',
      target_type: 'coupon',
      target_id: couponId,
      target_name: coupon.name,
      old_value: oldValues,
      new_value: newValues,
      reason: isActive !== undefined
        ? `${isActive ? 'Activated' : 'Deactivated'} coupon "${coupon.name}"`
        : `Updated coupon "${coupon.name}"`,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error in PATCH coupon:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/superadmin/coupons/[couponId] - Delete coupon from Stripe and deactivate locally
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { user, error: authError } = await verifySuperadmin(supabase)
    if (authError || !user) return authError!

    const { couponId } = await params

    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single()

    if (fetchError || !coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    // Check if there are completed redemptions - prevent deletion
    const { count } = await supabase
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', couponId)
      .eq('status', 'completed')

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a coupon with completed redemptions. Deactivate it instead.' },
        { status: 400 }
      )
    }

    // Delete from Stripe
    const stripe = getStripe()
    try {
      await stripe.coupons.del(coupon.stripe_coupon_id)
    } catch (e) {
      console.error('Error deleting coupon from Stripe:', e)
      // Continue even if Stripe delete fails (may already be deleted)
    }

    // Soft delete: deactivate locally
    await supabase
      .from('coupons')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', couponId)

    await supabase
      .from('coupon_promotion_codes')
      .update({ is_active: false })
      .eq('coupon_id', couponId)

    // Log activity
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabase.from('superuser_activity_logs').insert({
      superuser_id: user.id,
      action_type: 'coupon_deleted',
      target_type: 'coupon',
      target_id: couponId,
      target_name: coupon.name,
      old_value: { coupon },
      reason: `Deleted coupon "${coupon.name}"`,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE coupon:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
