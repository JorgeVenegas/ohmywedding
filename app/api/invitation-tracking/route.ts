import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Create a service role client for public tracking (bypasses RLS)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST - Track an invitation open
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weddingId, groupId, isOwnerView = false } = body

    if (!weddingId || !groupId) {
      return NextResponse.json({ error: "weddingId and groupId are required" }, { status: 400 })
    }

    // Get client info
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null
    
    // Detect device type from user agent
    let deviceType = 'desktop'
    if (userAgent) {
      const ua = userAgent.toLowerCase()
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceType = 'mobile'
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'tablet'
      }
    }

    // Use service role client to bypass RLS for tracking
    const supabase = createServiceClient()

    // Get wedding with owner and collaborator info
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingError || !wedding) {
      console.error('Wedding not found:', weddingId, weddingError)
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Check if the current user is the wedding owner or collaborator
    let isActuallyOwnerView = isOwnerView
    try {
      const authSupabase = await createServerSupabaseClient()
      const { data: { user } } = await authSupabase.auth.getUser()
      
      if (user) {
        // Check if user is owner
        if (user.id === wedding.owner_id) {
          isActuallyOwnerView = true
        }
        // Check if user is collaborator
        else if (wedding.collaborator_emails && Array.isArray(wedding.collaborator_emails)) {
          if (wedding.collaborator_emails.includes(user.email)) {
            isActuallyOwnerView = true
          }
        }
      }
    } catch {
      // If auth check fails, continue with the passed isOwnerView value
    }

    // Insert the open record
    const { data, error } = await supabase
      .from('invitation_opens')
      .insert({
        wedding_id: wedding.id,
        guest_group_id: groupId,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        is_owner_view: isActuallyOwnerView,
      })
      .select()
      .single()

    if (error) {
      console.error('Error tracking invitation open:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log activity (only for non-owner views)
    if (!isActuallyOwnerView) {
      // Get group name for activity log
      const { data: group } = await supabase
        .from('guest_groups')
        .select('name')
        .eq('id', groupId)
        .single()

      const groupName = group?.name || 'Unknown Group'

      await supabase
        .from('activity_logs')
        .insert({
          wedding_id: wedding.id,
          guest_group_id: groupId,
          activity_type: 'invitation_opened',
          description: `${groupName} opened their invitation`,
          metadata: {
            device_type: deviceType,
            ip_address: ipAddress?.substring(0, 3) + '***', // Partial IP for privacy
          }
        })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in invitation tracking:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get invitation open stats for a wedding
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const groupId = searchParams.get('groupId')

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get wedding UUID from wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    if (groupId) {
      // Get stats for a specific group
      const { data: opens, error } = await supabase
        .from('invitation_opens')
        .select('*')
        .eq('wedding_id', wedding.id)
        .eq('guest_group_id', groupId)
        .eq('is_owner_view', false)
        .order('opened_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Get group info with open stats
      const { data: group } = await supabase
        .from('guest_groups')
        .select('first_opened_at, open_count')
        .eq('id', groupId)
        .single()

      return NextResponse.json({
        groupId,
        totalOpens: opens?.length || 0,
        firstOpenedAt: group?.first_opened_at,
        openCount: group?.open_count || 0,
        opens: opens?.slice(0, 10) || [], // Return last 10 opens
      })
    }

    // Get aggregate stats for all groups
    const { data: groups, error: groupsError } = await supabase
      .from('guest_groups')
      .select('id, name, first_opened_at, open_count')
      .eq('wedding_id', wedding.id)
      .order('first_opened_at', { ascending: false, nullsFirst: false })

    if (groupsError) {
      return NextResponse.json({ error: groupsError.message }, { status: 400 })
    }

    const openedGroups = groups?.filter(g => g.open_count > 0) || []
    const unopenedGroups = groups?.filter(g => !g.open_count || g.open_count === 0) || []

    // Get total opens (non-owner)
    const { count: totalOpens } = await supabase
      .from('invitation_opens')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', wedding.id)
      .eq('is_owner_view', false)

    // Device type breakdown
    const { data: deviceStats } = await supabase
      .from('invitation_opens')
      .select('device_type')
      .eq('wedding_id', wedding.id)
      .eq('is_owner_view', false)

    const deviceBreakdown = {
      mobile: deviceStats?.filter(d => d.device_type === 'mobile').length || 0,
      tablet: deviceStats?.filter(d => d.device_type === 'tablet').length || 0,
      desktop: deviceStats?.filter(d => d.device_type === 'desktop').length || 0,
    }

    return NextResponse.json({
      totalGroups: groups?.length || 0,
      openedGroupsCount: openedGroups.length,
      unopenedGroupsCount: unopenedGroups.length,
      totalOpens: totalOpens || 0,
      deviceBreakdown,
      openedGroups: openedGroups.slice(0, 20),
      unopenedGroups: unopenedGroups.slice(0, 20),
    })
  } catch (error) {
    console.error('Error getting invitation stats:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
