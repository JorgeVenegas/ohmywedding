import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
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
    
    const { weddingId, newPlan, reason } = await request.json()
    
    if (!weddingId || !newPlan || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: weddingId, newPlan, reason" },
        { status: 400 }
      )
    }
    
    if (!['free', 'premium', 'deluxe'].includes(newPlan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'free', 'premium', or 'deluxe'" },
        { status: 400 }
      )
    }
    
    // Get current wedding info
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, wedding_name_id, partner1_first_name, partner1_last_name, partner2_first_name, partner2_last_name')
      .eq('id', weddingId)
      .single()
    
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }
    
    const partner1Name = `${wedding.partner1_first_name} ${wedding.partner1_last_name || ''}`.trim()
    const partner2Name = `${wedding.partner2_first_name} ${wedding.partner2_last_name || ''}`.trim()
    
    // Get current plan
    const { data: currentFeatures } = await supabase
      .from('wedding_subscriptions')
      .select('plan')
      .eq('wedding_id', weddingId)
      .single()
    
    const oldPlan = currentFeatures?.plan || 'free'
    
    if (oldPlan === newPlan) {
      return NextResponse.json(
        { error: "Wedding already has this plan" },
        { status: 400 }
      )
    }
    
    // Update wedding subscription with new plan
    const { error: updateError } = await supabase
      .from('wedding_subscriptions')
      .upsert({
        wedding_id: weddingId,
        plan: newPlan,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wedding_id'
      })
    
    if (updateError) {
      console.error('Error updating wedding features:', updateError)
      return NextResponse.json(
        { error: "Failed to update wedding plan" },
        { status: 500 }
      )
    }
    
    // Get IP and user agent for logging
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Log the activity
    const { error: logError } = await supabase
      .from('superuser_activity_logs')
      .insert({
        superuser_id: user.id,
        action_type: 'plan_change',
        target_type: 'wedding',
        target_id: weddingId,
        target_name: `${partner1Name} & ${partner2Name} (${wedding.wedding_name_id})`,
        old_value: { plan: oldPlan },
        new_value: { plan: newPlan },
        reason,
        ip_address: ip,
        user_agent: userAgent
      })
    
    if (logError) {
      console.error('Error logging activity:', logError)
      // Don't fail the request, just log the error
    }
    
    return NextResponse.json({
      success: true,
      message: `Plan changed from ${oldPlan} to ${newPlan}`,
      wedding: {
        id: wedding.id,
        wedding_name_id: wedding.wedding_name_id,
        oldPlan,
        newPlan
      }
    })
  } catch (error) {
    console.error('Error in change-plan:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
