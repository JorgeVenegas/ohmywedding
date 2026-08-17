import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { STRIPE_API_VERSION } from '@/lib/stripe-config'
import { AI_CREDIT_PACKAGES } from '@/lib/ai/credits'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION as never })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { packageId, weddingId } = await req.json()
    if (!packageId || !weddingId) {
      return NextResponse.json({ error: 'packageId and weddingId required' }, { status: 400 })
    }

    const pkg = AI_CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 })

    // Verify the user has access to this wedding
    const admin = createAdminSupabaseClient()
    const { data: wedding } = await admin
      .from('weddings')
      .select('id, name')
      .eq('id', weddingId)
      .single()
    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const { data: perms } = await admin
      .from('collaborator_permissions')
      .select('id')
      .eq('wedding_id', weddingId)
      .eq('user_id', user.id)
      .single()
    const { data: isOwner } = await admin
      .from('weddings')
      .select('id')
      .eq('id', weddingId)
      .eq('owner_id', user.id)
      .single()
    if (!perms && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const stripe = getStripe()
    const host = req.headers.get('host') ?? ''
    const proto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = `${proto}://${host}`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      currency: 'usd',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Aria AI Credits — ${pkg.label}`,
            description: pkg.description,
          },
          unit_amount: pkg.amount_cents,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/admin/${weddingId}/dashboard?ai_credits=success`,
      cancel_url:  `${baseUrl}/admin/${weddingId}/dashboard?ai_credits=cancelled`,
      metadata: {
        weddingId,
        userId: user.id,
        amountCents: String(pkg.amount_cents),
        packageId: pkg.id,
      },
    })

    // Create a pending purchase record
    await admin.from('ai_credit_purchases').insert({
      wedding_id:                 weddingId,
      amount_cents:               pkg.amount_cents,
      stripe_checkout_session_id: session.id,
      status:                     'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[AI credits checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
