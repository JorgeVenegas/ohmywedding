import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { getWeddingUrl, type WeddingPlan } from '@/lib/wedding-url'
import { captureWeddingScreenshot } from '@/lib/screenshot'
import { putObject, presignDownload } from '@/lib/s3'

export const runtime = 'nodejs'
// Two headless passes (envelope shot + full-page shot), the stitch, and the upload.
// ~90s+ on a cold serverless container. Needs a Vercel plan that allows this (Hobby
// caps functions at 60s regardless of this value).
export const maxDuration = 300

// GET /api/weddings/[weddingId]/screenshot?device=desktop|mobile[&groupId=…] — admin only.
// Renders the live invitation in a headless browser, uploads the JPEG to storage, and
// returns { url } — a short-lived presigned download link. (The image is multi-MB, over
// the ~4.5 MB serverless response-body cap, so it can't be returned inline.)
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
    const groupId = searchParams.get('groupId')?.trim() || null
    const rsvpViewParam = searchParams.get('rsvpView')
    const rsvpView = rsvpViewParam === 'form' || rsvpViewParam === 'confirmed' ? rsvpViewParam : null

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
    // No ?capture flag — lib/screenshot.ts drives each of its two passes via a
    // window global (redirect-proof; the subdomain redirect strips query strings).
    // groupId personalizes the envelope ("Para: …") and the RSVP section, which both
    // already read it from the URL.
    if (groupId) targetUrl.searchParams.set('groupId', groupId)
    // Only meaningful alongside a groupId — pins the RSVP section to the form / confirmed view.
    if (groupId && rsvpView) targetUrl.searchParams.set('rsvpView', rsvpView)

    const image = await captureWeddingScreenshot(targetUrl.toString(), device)

    const slug = `${device}${groupId ? '-personalized' : ''}`
    const filename = `${wedding.wedding_name_id}-invitation${groupId ? '-personalized' : ''}-${device}.jpg`
    const key = `screenshots/${wedding.wedding_name_id}/${Date.now()}-${slug}.jpg`
    await putObject(key, image, 'image/jpeg')
    const url = await presignDownload(key, filename, 600)

    return NextResponse.json({ url, filename }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[screenshot]', error)
    return NextResponse.json({ error: 'Failed to capture screenshot' }, { status: 500 })
  }
}
