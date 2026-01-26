import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - Serve tracking pixel and record open
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('w')
    const groupId = searchParams.get('g')
    const isOwner = searchParams.get('o') === '1'

    // 1x1 transparent PNG pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )

    // If we have valid tracking parameters, record the open
    if (weddingId && groupId) {
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

      const supabase = createClient()

      // Get wedding UUID from wedding_name_id
      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
        .eq('wedding_name_id', weddingId)
        .single()

      if (wedding) {
        // Insert the open record
        await supabase
          .from('invitation_opens')
          .insert({
            wedding_id: wedding.id,
            guest_group_id: groupId,
            ip_address: ipAddress,
            user_agent: userAgent,
            device_type: deviceType,
            is_owner_view: isOwner,
          })

        // Log activity (only for non-owner views)
        if (!isOwner) {
          const { data: group } = await supabase
            .from('guest_groups')
            .select('name')
            .eq('id', groupId)
            .single()

          const groupName = group?.name || 'A guest'

          await supabase
            .from('activity_logs')
            .insert({
              wedding_id: wedding.id,
              guest_group_id: groupId,
              activity_type: 'invitation_opened',
              description: `${groupName} opened their invitation`,
              metadata: {
                device_type: deviceType,
              }
            })
        }
      }
    }

    // Return the tracking pixel
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error in tracking pixel:', error)
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  }
}
