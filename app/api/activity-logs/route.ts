import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server"
import { createClient } from "@/lib/supabase-client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - Get activity logs for a wedding
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const activityType = searchParams.get('type')
    const groupId = searchParams.get('groupId')

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()

    // Get wedding UUID from wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Get wedding plan to determine activity limits
    const { data: weddingFeatures } = await adminClient
      .from('wedding_features')
      .select('plan')
      .eq('wedding_id', wedding.id)
      .single()

    const plan = (weddingFeatures?.plan as 'free' | 'premium' | 'deluxe') || 'free'

    // Get plan-specific activity tracking limit
    const { data: planFeatures } = await adminClient
      .from('plan_features')
      .select('limit_value')
      .eq('plan', plan)
      .eq('feature_key', 'activity_tracking_limit')
      .single()

    let effectiveLimit = limit
    const planLimit = planFeatures?.limit_value

    // Apply plan-based limits
    // Free: 10 items, Premium: 7 days of data, Deluxe: unlimited
    if (plan === 'free' && planLimit !== null) {
      effectiveLimit = Math.min(limit, planLimit) // Cap at plan limit (default 10)
    } else if (plan === 'premium') {
      // Premium: Filter to last 7 days
      // We'll add a date filter below
    }
    // Deluxe: no limits

    let query = supabase
      .from('activity_logs')
      .select(`
        id,
        activity_type,
        description,
        metadata,
        created_at,
        guest_group_id,
        guest_id,
        guest_groups (name),
        guests (name)
      `)
      .eq('wedding_id', wedding.id)
      .order('created_at', { ascending: false })
      .limit(effectiveLimit)

    // Premium: Only show last 7 days
    if (plan === 'premium') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query = query.gte('created_at', sevenDaysAgo.toISOString())
    }

    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    if (groupId) {
      query = query.eq('guest_group_id', groupId)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching activity logs:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Format activities for frontend
    const formattedActivities = activities?.map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.created_at,
      groupName: (activity.guest_groups as any)?.name,
      guestName: (activity.guests as any)?.name,
    })) || []

    return NextResponse.json({ 
      activities: formattedActivities,
      plan,
      limit: effectiveLimit 
    })
  } catch (error) {
    console.error('Error getting activity logs:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Log a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weddingId, activityType, description, groupId, guestId, metadata = {} } = body

    if (!weddingId || !activityType || !description) {
      return NextResponse.json({ 
        error: "weddingId, activityType, and description are required" 
      }, { status: 400 })
    }

    const supabase = createClient()

    // Get wedding UUID from wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        wedding_id: wedding.id,
        guest_group_id: groupId || null,
        guest_id: guestId || null,
        activity_type: activityType,
        description,
        metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging activity:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in activity logging:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
