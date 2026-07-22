import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION as any })

// POST /api/superadmin/coupons/sync
// Pulls times_redeemed, valid, and promotion-code active status from Stripe.
// All Stripe fetches run in parallel. Safe to call any time — read-only on Stripe.
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!(await isSuperUser(supabase, { userId: user.id }))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminSupabaseClient()
    const stripe = getStripe()

    const { data: coupons, error: fetchErr } = await admin
      .from('coupons')
      .select('id, stripe_coupon_id, times_redeemed, is_active, coupon_promotion_codes(id, stripe_promotion_code_id, times_redeemed, is_active)')

    if (fetchErr || !coupons) {
      return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }

    // Fetch all Stripe coupons in parallel
    const couponResults = await Promise.allSettled(
      coupons.map(c => stripe.coupons.retrieve(c.stripe_coupon_id))
    )

    // Gather all local promo codes flat
    type LocalCode = { id: string; stripe_promotion_code_id: string | null; times_redeemed: number; is_active: boolean }
    const allCodes: Array<{ couponIdx: number; code: LocalCode }> = []
    coupons.forEach((c, i) => {
      const codes = (c as any).coupon_promotion_codes as LocalCode[] ?? []
      codes.forEach(code => { if (code.stripe_promotion_code_id) allCodes.push({ couponIdx: i, code }) })
    })

    // Fetch all Stripe promo codes in parallel
    const promoResults = await Promise.allSettled(
      allCodes.map(({ code }) => stripe.promotionCodes.retrieve(code.stripe_promotion_code_id!))
    )

    let changed = 0
    let errors = 0
    let notFound = 0

    // Apply coupon updates
    for (let i = 0; i < coupons.length; i++) {
      const result = couponResults[i]
      const coupon = coupons[i]

      if (result.status === 'rejected') {
        const err = result.reason as any
        if (err?.code === 'resource_missing') notFound++
        else errors++
        continue
      }

      const sc = result.value
      const updates: Record<string, unknown> = {}

      if (sc.times_redeemed !== coupon.times_redeemed) {
        updates.times_redeemed = sc.times_redeemed
      }

      if (Object.keys(updates).length > 0) {
        await admin.from('coupons').update(updates).eq('id', coupon.id)
        changed++
      }
    }

    // Apply promotion code updates
    for (let i = 0; i < allCodes.length; i++) {
      const result = promoResults[i]
      const { code } = allCodes[i]

      if (result.status === 'rejected') continue

      const sp = result.value
      const updates: Record<string, unknown> = {}

      if (sp.times_redeemed !== code.times_redeemed) {
        updates.times_redeemed = sp.times_redeemed
      }
      // Sync active status — but only flip to inactive, never auto-reactivate
      if (!sp.active && code.is_active) {
        updates.is_active = false
      }

      if (Object.keys(updates).length > 0) {
        await admin.from('coupon_promotion_codes').update(updates).eq('id', code.id)
        changed++
      }
    }

    return NextResponse.json({
      success: true,
      synced: coupons.length,
      changed,
      notFound,
      errors,
    })
  } catch (err) {
    console.error('[coupons/sync] Error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
