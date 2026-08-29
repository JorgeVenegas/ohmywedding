import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { getWeddingUrl, type WeddingPlan } from '@/lib/wedding-url'
import { captureWeddingScreenshot } from '@/lib/screenshot'

export const runtime = 'nodejs'
export const maxDuration = 90

// GET /api/weddings/[weddingId]/screenshot?device=desktop|mobile — admin only
// Renders the live invitation in a headless browser and returns a full-page PNG.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { weddingId } = await params
    const decodedWeddingId = decodeURIComponent(weddingId)

    const { searchParams } = new URL(request.url)
    const device = searchParams.get('device') === 'mobile' ? 'mobile' : 'desktop'

    const admin = createAdminSupabaseClient()
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedWeddingId)

    const { data: wedding, error: weddingError } = await admin
      .from('weddings')
      .select('id, wedding_name_id, owner_id, collaborator_emails')
      .eq(isUUID ? 'id' : 'wedding_name_id', decodedWeddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    const superuser = await isSuperUser(admin, { email: user.email })
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = (wedding.collaborator_emails as string[] | null)
      ?.includes(user.email?.toLowerCase() ?? '') ?? false

    if (!superuser && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: subscription } = await admin
      .from('wedding_subscriptions')
      .select('plan')
      .eq('wedding_id', wedding.id)
      .maybeSingle()

    const plan = (subscription?.plan || 'free') as WeddingPlan

    // getWeddingUrl returns a full https URL in production (subdomain- or path-based
    // depending on plan) and a relative path in local dev — resolve against this
    // request's own origin so the relative-path case still yields a fetchable URL.
    const weddingUrl = getWeddingUrl(wedding.wedding_name_id, '', plan)
    const targetUrl = new URL(weddingUrl, request.nextUrl.origin)
    targetUrl.searchParams.set('capture', '1')

    const png = await captureWeddingScreenshot(targetUrl.toString(), device)

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${wedding.wedding_name_id}-invitation-${device}.png"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[screenshot]', error)
    return NextResponse.json({ error: 'Failed to capture screenshot' }, { status: 500 })
  }
}
