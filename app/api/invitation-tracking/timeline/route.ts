import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - Get timeline data for confirmations and opens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const range = searchParams.get('range') || 'all' // all, 30d, 14d, 7d
    const groupId = searchParams.get('groupId') // optional filter

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

    // Calculate date range
    let startDate: Date | null = null
    const now = new Date()
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '14d':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = null // All time
    }

    // Fetch activity logs for confirmations/declines
    let activityQuery = supabase
      .from('activity_logs')
      .select(`
        id,
        activity_type,
        description,
        metadata,
        created_at,
        guest_group_id,
        guest_id,
        guest_groups (id, name),
        guests (id, name)
      `)
      .eq('wedding_id', wedding.id)
      .in('activity_type', ['rsvp_confirmed', 'rsvp_declined', 'rsvp_updated'])
      .order('created_at', { ascending: true })

    if (startDate) {
      activityQuery = activityQuery.gte('created_at', startDate.toISOString())
    }

    if (groupId) {
      activityQuery = activityQuery.eq('guest_group_id', groupId)
    }

    const { data: activities, error: activityError } = await activityQuery

    if (activityError) {
      console.error('Error fetching activities:', activityError)
      return NextResponse.json({ error: activityError.message }, { status: 400 })
    }

    // Fetch invitation opens
    let opensQuery = supabase
      .from('invitation_opens')
      .select(`
        id,
        opened_at,
        device_type,
        is_owner_view,
        guest_group_id,
        guest_groups (id, name)
      `)
      .eq('wedding_id', wedding.id)
      .eq('is_owner_view', false)
      .order('opened_at', { ascending: true })

    if (startDate) {
      opensQuery = opensQuery.gte('opened_at', startDate.toISOString())
    }

    if (groupId) {
      opensQuery = opensQuery.eq('guest_group_id', groupId)
    }

    const { data: opens, error: opensError } = await opensQuery

    if (opensError) {
      console.error('Error fetching opens:', opensError)
      return NextResponse.json({ error: opensError.message }, { status: 400 })
    }

    // Process data into timeline format
    // Group by day for the chart
    const dailyData: Record<string, {
      date: string
      confirmed: number
      declined: number
      opens: number
    }> = {}

    // Process activities
    const confirmationEvents: Array<{
      id: string
      type: 'confirmed' | 'declined' | 'updated'
      timestamp: string
      groupId: string
      groupName: string
      guestId?: string
      guestName?: string
      description: string
    }> = []

    activities?.forEach(activity => {
      const date = new Date(activity.created_at).toISOString().split('T')[0]
      
      if (!dailyData[date]) {
        dailyData[date] = { date, confirmed: 0, declined: 0, opens: 0 }
      }

      if (activity.activity_type === 'rsvp_confirmed') {
        dailyData[date].confirmed++
      } else if (activity.activity_type === 'rsvp_declined') {
        dailyData[date].declined++
      }

      confirmationEvents.push({
        id: activity.id,
        type: activity.activity_type === 'rsvp_confirmed' ? 'confirmed' : 
              activity.activity_type === 'rsvp_declined' ? 'declined' : 'updated',
        timestamp: activity.created_at,
        groupId: activity.guest_group_id,
        groupName: (activity.guest_groups as any)?.name || 'Unknown',
        guestId: activity.guest_id,
        guestName: (activity.guests as any)?.name,
        description: activity.description,
      })
    })

    // Process opens
    const openEvents: Array<{
      id: string
      timestamp: string
      groupId: string
      groupName: string
      deviceType: string
    }> = []

    opens?.forEach(open => {
      const date = new Date(open.opened_at).toISOString().split('T')[0]
      
      if (!dailyData[date]) {
        dailyData[date] = { date, confirmed: 0, declined: 0, opens: 0 }
      }

      dailyData[date].opens++

      openEvents.push({
        id: open.id,
        timestamp: open.opened_at,
        groupId: open.guest_group_id,
        groupName: (open.guest_groups as any)?.name || 'Unknown',
        deviceType: open.device_type || 'unknown',
      })
    })

    // Create full date range array for the selected period
    const allDates = [
      ...(activities?.map(a => new Date(a.created_at).getTime()) || []),
      ...(opens?.map(o => new Date(o.opened_at).getTime()) || [])
    ]
    const earliestDate = allDates.length > 0 ? Math.min(...allDates) : now.getTime()
    const chartStartDate = startDate ? new Date(startDate).getTime() : earliestDate
    
    // Build full date range
    const dateRange: Date[] = []
    const currentDate = new Date(chartStartDate)
    currentDate.setHours(0, 0, 0, 0)
    const endDate = new Date()
    endDate.setHours(0, 0, 0, 0)

    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Initialize all dates with zero values
    const fullDailyData: Record<string, {
      date: string
      confirmed: number
      declined: number
      opens: number
    }> = {}

    dateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]
      fullDailyData[dateStr] = { date: dateStr, confirmed: 0, declined: 0, opens: 0 }
    })

    // Merge in actual data
    Object.assign(fullDailyData, dailyData)

    // Convert to sorted array and calculate cumulative values
    const chartData = Object.values(fullDailyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .reduce((acc, day, index) => {
        const prev = acc[index - 1]
        acc.push({
          ...day,
          cumulativeConfirmed: (prev?.cumulativeConfirmed || 0) + day.confirmed,
          cumulativeDeclined: (prev?.cumulativeDeclined || 0) + day.declined,
          cumulativeOpens: (prev?.cumulativeOpens || 0) + day.opens,
        })
        return acc
      }, [] as Array<typeof dailyData[string] & { 
        cumulativeConfirmed: number
        cumulativeDeclined: number
        cumulativeOpens: number
      }>)

    // Get summary stats
    const totalConfirmed = confirmationEvents.filter(e => e.type === 'confirmed').length
    const totalDeclined = confirmationEvents.filter(e => e.type === 'declined').length
    const totalOpens = openEvents.length

    return NextResponse.json({
      chartData,
      confirmationEvents: confirmationEvents.reverse(), // Most recent first
      openEvents: openEvents.reverse(),
      summary: {
        totalConfirmed,
        totalDeclined,
        totalOpens,
      }
    })
  } catch (error) {
    console.error('Error getting timeline data:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
