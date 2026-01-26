import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getDefaultFeatures } from '@/lib/subscription-shared'

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  })
}

// Use service role key for webhook (bypasses RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()
  
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get user ID from metadata
        const userId = session.metadata?.user_id
        const planType = session.metadata?.plan_type

        if (!userId || planType !== 'premium') {
          break
        }

        // Create or update user subscription
        const { error: subscriptionError } = await supabaseAdmin
          .from('user_subscriptions')
          .upsert(
            {
              user_id: userId,
              plan_type: 'premium',
              status: 'active',
              started_at: new Date().toISOString(),
              expires_at: null, // One-time payment, no expiration
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.payment_intent as string,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )

        if (subscriptionError) {
          throw subscriptionError
        }

        // Update features for all user's weddings
        const { data: userWeddings, error: weddingsError } = await supabaseAdmin
          .from('weddings')
          .select('id')
          .eq('user_id', userId)

        if (weddingsError) {
        } else if (userWeddings && userWeddings.length > 0) {
          const premiumFeatures = getDefaultFeatures('premium')

          for (const wedding of userWeddings) {
            const { error: featuresError } = await supabaseAdmin
              .from('wedding_features')
              .upsert(
                {
                  wedding_id: wedding.id,
                  ...premiumFeatures,
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: 'wedding_id',
                }
              )

            if (featuresError) {
            }
          }
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        // Could send email notification here
        break
      }

      default:
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
