import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET all plan features
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated and is superuser
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { data: superuser } = await supabase
      .from('superusers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!superuser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { data, error } = await supabase
      .from('plan_features')
      .select('*')
      .order('plan')
      .order('feature_key')
    
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching plan features:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update a plan feature
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is a superuser
    const { data: superuser } = await supabase
      .from('superusers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!superuser) {
      return NextResponse.json({ error: "Forbidden - Superuser access required" }, { status: 403 })
    }
    
    const { featureId, enabled, limitValue, configJson, reason } = await request.json()
    
    if (!featureId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: featureId, reason" },
        { status: 400 }
      )
    }
    
    // Get current feature
    const { data: currentFeature, error: fetchError } = await supabase
      .from('plan_features')
      .select('*')
      .eq('id', featureId)
      .single()
    
    if (fetchError || !currentFeature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }
    
    // Update feature
    const { error: updateError } = await supabase
      .from('plan_features')
      .update({
        enabled: enabled ?? currentFeature.enabled,
        limit_value: limitValue !== undefined ? limitValue : currentFeature.limit_value,
        config_json: configJson ?? currentFeature.config_json,
        updated_at: new Date().toISOString()
      })
      .eq('id', featureId)
    
    if (updateError) {
      console.error('Error updating feature:', updateError)
      return NextResponse.json({ error: "Failed to update feature" }, { status: 500 })
    }
    
    // Get IP and user agent for logging
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Log the activity
    await supabase
      .from('superuser_activity_logs')
      .insert({
        superuser_id: user.id,
        action_type: 'feature_update',
        target_type: 'plan_feature',
        target_id: featureId,
        target_name: `${currentFeature.plan} - ${currentFeature.feature_key}`,
        old_value: {
          enabled: currentFeature.enabled,
          limit_value: currentFeature.limit_value,
          config_json: currentFeature.config_json
        },
        new_value: {
          enabled: enabled ?? currentFeature.enabled,
          limit_value: limitValue !== undefined ? limitValue : currentFeature.limit_value,
          config_json: configJson ?? currentFeature.config_json
        },
        reason,
        ip_address: ip,
        user_agent: userAgent
      })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in plan-features PUT:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
