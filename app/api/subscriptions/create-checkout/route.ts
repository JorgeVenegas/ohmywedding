import { NextResponse, NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PRICING } from '@/lib/subscription-shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  })
}

const VALID_PLANS = ['premium', 'deluxe'] as const
type ValidPlan = typeof VALID_PLANS[number]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // NOTE: User subscriptions have been removed. This endpoint is deprecated.
    // Plans are now per-wedding, not per-user. Use the wedding plan management endpoints instead.
    return NextResponse.json(
      { error: 'User subscriptions have been removed. Plans are now per-wedding.' },
      { status: 410 } // 410 Gone - the resource is no longer available
    )
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
