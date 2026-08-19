import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'
import { presignGet, keyFromUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ weddingId: string; imageId: string }> },
) {
  try {
    const { weddingId, imageId } = await params
    const decoded = decodeURIComponent(weddingId)

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminSupabaseClient()

    // Resolve wedding by UUID or name_id
    const isUUID = UUID_REGEX.test(decoded)
    const { data: wedding, error: weddingErr } = await adminClient
      .from('weddings')
      .select('id, owner_id, collaborator_emails')
      .eq(isUUID ? 'id' : 'wedding_name_id', decoded)
      .single()

    if (weddingErr || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    const isSuperuser = await isSuperUser(adminClient, { email: user.email })
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = (wedding.collaborator_emails as string[] | null)?.includes(user.email?.toLowerCase() ?? '') ?? false

    if (!isSuperuser && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch image, verifying it belongs to this wedding
    const { data: image, error: imgErr } = await adminClient
      .from('images')
      .select('id, url, storage_path, filename')
      .eq('id', imageId)
      .eq('wedding_id', wedding.id)
      .single()

    if (imgErr || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const key = image.storage_path || keyFromUrl(image.url)
    if (!key) {
      return NextResponse.json({ error: 'Image storage path not available' }, { status: 422 })
    }

    const filename = image.filename || key.split('/').pop() || 'photo.jpg'
    const presignedUrl = await presignGet(key, filename)

    return NextResponse.redirect(presignedUrl, { status: 302 })
  } catch (err) {
    console.error('[photos/download]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
