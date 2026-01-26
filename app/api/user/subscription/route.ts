import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no subscription found, return default free plan
    const plan = subscription?.plan_type || 'free'
    const status = subscription?.status || 'active'

    // Get features for the plan using the database function
    const { data: featuresData, error: featuresError } = await supabase.rpc(
      'get_plan_features',
      { p_plan_type: plan }
    )

    if (featuresError) {
    }

    // Convert features array to object
    const features: Record<string, boolean> = {}
    if (featuresData) {
      featuresData.forEach((f: { feature_name: string; is_available: boolean }) => {
        features[f.feature_name] = f.is_available
      })
    }

    return NextResponse.json({
      subscription: {
        plan: plan,
        status: status,
        started_at: subscription?.started_at,
        expires_at: subscription?.expires_at,
      },
      features: features,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
