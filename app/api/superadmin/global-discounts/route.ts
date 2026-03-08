import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function verifySuperadmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: superuser } = await supabaseAdmin
    .from('superusers')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return superuser ? user : null
}

const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION as any,
  })
}

/**
 * Create Stripe coupons for each plan/payment-method combo that has a non-zero discount.
 * Returns a map of column names to Stripe coupon IDs.
 */
async function createStripeCoupons(
  discountName: string,
  percents: {
    premium_card: number
    premium_msi: number
    deluxe_card: number
    deluxe_msi: number
  },
  discountId: string
): Promise<Record<string, string>> {
  const stripe = getStripe()
  const result: Record<string, string> = {}

  const combos = [
    { key: 'premium_card_stripe_coupon_id', pct: percents.premium_card, label: 'Premium Card' },
    { key: 'premium_msi_stripe_coupon_id', pct: percents.premium_msi, label: 'Premium MSI' },
    { key: 'deluxe_card_stripe_coupon_id', pct: percents.deluxe_card, label: 'Deluxe Card' },
    { key: 'deluxe_msi_stripe_coupon_id', pct: percents.deluxe_msi, label: 'Deluxe MSI' },
  ]

  for (const combo of combos) {
    if (combo.pct > 0) {
      try {
        const coupon = await stripe.coupons.create({
          percent_off: combo.pct,
          currency: 'mxn',
          name: `${discountName} - ${combo.label}`,
          metadata: {
            global_discount_id: discountId,
            combo: combo.label,
          },
        })
        result[combo.key] = coupon.id
      } catch (err) {
        console.error(`Failed to create Stripe coupon for ${combo.label}:`, err)
      }
    }
  }

  return result
}

// GET /api/superadmin/global-discounts — list all global discounts
export async function GET() {
  const user = await verifySuperadmin()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin
    .from('global_discounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ discounts: data })
}

// POST /api/superadmin/global-discounts — create new global discount
export async function POST(request: NextRequest) {
  const user = await verifySuperadmin()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    name,
    label,
    premiumCardDiscountPercent = 0,
    premiumMsiDiscountPercent = 0,
    deluxeCardDiscountPercent = 0,
    deluxeMsiDiscountPercent = 0,
    appliesToPlans = ['premium', 'deluxe'],
    startsAt,
    endsAt,
    isActive = false,
  } = body

  if (!name?.trim() || !label?.trim()) {
    return NextResponse.json({ error: 'Name and label are required' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // If activating, deactivate all others first
  if (isActive) {
    await supabaseAdmin
      .from('global_discounts')
      .update({ is_active: false })
      .eq('is_active', true)
  }

  const { data, error } = await supabaseAdmin
    .from('global_discounts')
    .insert({
      name: name.trim(),
      label: label.trim(),
      is_active: isActive,
      premium_card_discount_percent: Math.max(0, Math.min(100, parseInt(premiumCardDiscountPercent) || 0)),
      premium_msi_discount_percent: Math.max(0, Math.min(100, parseInt(premiumMsiDiscountPercent) || 0)),
      deluxe_card_discount_percent: Math.max(0, Math.min(100, parseInt(deluxeCardDiscountPercent) || 0)),
      deluxe_msi_discount_percent: Math.max(0, Math.min(100, parseInt(deluxeMsiDiscountPercent) || 0)),
      applies_to_plans: appliesToPlans,
      starts_at: startsAt || new Date().toISOString(),
      ends_at: endsAt || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create Stripe coupons for each plan/payment-method combo with non-zero discount
  const pCard = Math.max(0, Math.min(100, parseInt(premiumCardDiscountPercent) || 0))
  const pMsi = Math.max(0, Math.min(100, parseInt(premiumMsiDiscountPercent) || 0))
  const dCard = Math.max(0, Math.min(100, parseInt(deluxeCardDiscountPercent) || 0))
  const dMsi = Math.max(0, Math.min(100, parseInt(deluxeMsiDiscountPercent) || 0))

  if (pCard > 0 || pMsi > 0 || dCard > 0 || dMsi > 0) {
    const couponIds = await createStripeCoupons(
      name.trim(),
      { premium_card: pCard, premium_msi: pMsi, deluxe_card: dCard, deluxe_msi: dMsi },
      data.id
    )

    if (Object.keys(couponIds).length > 0) {
      const { data: updatedDiscount } = await supabaseAdmin
        .from('global_discounts')
        .update(couponIds)
        .eq('id', data.id)
        .select()
        .single()

      if (updatedDiscount) {
        Object.assign(data, updatedDiscount)
      }
    }
  }

  // Log activity
  await supabaseAdmin.from('superuser_activity_logs').insert({
    superuser_id: user.id,
    action_type: 'create_global_discount',
    target_type: 'global_discount',
    target_id: data.id,
    target_name: data.name,
    reason: `Created global discount: ${data.name} (Premium: Card ${data.premium_card_discount_percent}%/MSI ${data.premium_msi_discount_percent}%, Deluxe: Card ${data.deluxe_card_discount_percent}%/MSI ${data.deluxe_msi_discount_percent}%)`,
  })

  return NextResponse.json({ discount: data })
}

// PATCH /api/superadmin/global-discounts — update a global discount
export async function PATCH(request: NextRequest) {
  const user = await verifySuperadmin()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Discount ID is required' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Build update object
  const updateData: Record<string, unknown> = {}

  if (updates.name !== undefined) updateData.name = updates.name.trim()
  if (updates.label !== undefined) updateData.label = updates.label.trim()
  if (updates.premiumCardDiscountPercent !== undefined) {
    updateData.premium_card_discount_percent = Math.max(0, Math.min(100, parseInt(updates.premiumCardDiscountPercent) || 0))
  }
  if (updates.premiumMsiDiscountPercent !== undefined) {
    updateData.premium_msi_discount_percent = Math.max(0, Math.min(100, parseInt(updates.premiumMsiDiscountPercent) || 0))
  }
  if (updates.deluxeCardDiscountPercent !== undefined) {
    updateData.deluxe_card_discount_percent = Math.max(0, Math.min(100, parseInt(updates.deluxeCardDiscountPercent) || 0))
  }
  if (updates.deluxeMsiDiscountPercent !== undefined) {
    updateData.deluxe_msi_discount_percent = Math.max(0, Math.min(100, parseInt(updates.deluxeMsiDiscountPercent) || 0))
  }
  if (updates.appliesToPlans !== undefined) updateData.applies_to_plans = updates.appliesToPlans
  if (updates.startsAt !== undefined) updateData.starts_at = updates.startsAt
  if (updates.endsAt !== undefined) updateData.ends_at = updates.endsAt || null

  // Handle is_active toggle
  if (updates.isActive !== undefined) {
    if (updates.isActive) {
      // Deactivate all others first
      await supabaseAdmin
        .from('global_discounts')
        .update({ is_active: false })
        .eq('is_active', true)
        .neq('id', id)
    }
    updateData.is_active = updates.isActive
  }

  const { data, error } = await supabaseAdmin
    .from('global_discounts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If any discount percentages changed, recreate Stripe coupons for the affected combos
  const percentFieldsChanged = [
    'premiumCardDiscountPercent',
    'premiumMsiDiscountPercent',
    'deluxeCardDiscountPercent',
    'deluxeMsiDiscountPercent',
  ].some(f => updates[f] !== undefined)

  if (percentFieldsChanged) {
    const couponIds = await createStripeCoupons(
      data.name,
      {
        premium_card: data.premium_card_discount_percent,
        premium_msi: data.premium_msi_discount_percent,
        deluxe_card: data.deluxe_card_discount_percent,
        deluxe_msi: data.deluxe_msi_discount_percent,
      },
      data.id
    )

    // Build update: new coupon IDs for non-zero combos, null for zeroed-out combos
    const couponUpdate: Record<string, string | null> = {}
    const pctMap: Record<string, number> = {
      premium_card_stripe_coupon_id: data.premium_card_discount_percent,
      premium_msi_stripe_coupon_id: data.premium_msi_discount_percent,
      deluxe_card_stripe_coupon_id: data.deluxe_card_discount_percent,
      deluxe_msi_stripe_coupon_id: data.deluxe_msi_discount_percent,
    }
    for (const k of Object.keys(pctMap)) {
      if (couponIds[k]) {
        couponUpdate[k] = couponIds[k]
      } else if (pctMap[k] === 0) {
        couponUpdate[k] = null
      }
    }

    if (Object.keys(couponUpdate).length > 0) {
      const { data: updatedDiscount } = await supabaseAdmin
        .from('global_discounts')
        .update(couponUpdate)
        .eq('id', id)
        .select()
        .single()

      if (updatedDiscount) {
        Object.assign(data, updatedDiscount)
      }
    }
  }

  await supabaseAdmin.from('superuser_activity_logs').insert({
    superuser_id: user.id,
    action_type: 'update_global_discount',
    target_type: 'global_discount',
    target_id: data.id,
    target_name: data.name,
    reason: `Updated global discount: ${data.name}`,
  })

  return NextResponse.json({ discount: data })
}

// DELETE /api/superadmin/global-discounts — delete a global discount
export async function DELETE(request: NextRequest) {
  const user = await verifySuperadmin()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Discount ID is required' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get name for logging
  const { data: existing } = await supabaseAdmin
    .from('global_discounts')
    .select('name')
    .eq('id', id)
    .single()

  const { error } = await supabaseAdmin
    .from('global_discounts')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAdmin.from('superuser_activity_logs').insert({
    superuser_id: user.id,
    action_type: 'delete_global_discount',
    target_type: 'global_discount',
    target_id: id,
    target_name: existing?.name || 'Unknown',
    reason: `Deleted global discount: ${existing?.name || id}`,
  })

  return NextResponse.json({ success: true })
}
