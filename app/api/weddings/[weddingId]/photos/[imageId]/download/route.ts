import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SUPABASE_BUCKET = 'wedding-images'

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

    const { data: image, error: imgErr } = await adminClient
      .from('images')
      .select('id, url, storage_path, filename, mime_type')
      .eq('id', imageId)
      .eq('wedding_id', wedding.id)
      .single()

    if (imgErr || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const filename = image.filename || image.url.split('/').pop() || 'photo.jpg'
    const contentType = image.mime_type || 'application/octet-stream'

    // Primary: proxy via the stored public URL (works for S3 and public Supabase buckets)
    const upstream = await fetch(image.url).catch(() => null)
    if (upstream?.ok) {
      return new NextResponse(upstream.body, {
        headers: {
          'Content-Type': upstream.headers.get('content-type') || contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Cache-Control': 'private, no-store',
        },
      })
    }

    // Fallback: generate a Supabase storage signed URL using storage_path
    if (image.storage_path) {
      // storage_path may or may not include the bucket prefix — strip it if present
      const storagePath = image.storage_path.startsWith(`${SUPABASE_BUCKET}/`)
        ? image.storage_path.slice(SUPABASE_BUCKET.length + 1)
        : image.storage_path

      const { data: signed, error: signErr } = await adminClient.storage
        .from(SUPABASE_BUCKET)
        .createSignedUrl(storagePath, 300, {
          download: filename,
        })

      if (!signErr && signed?.signedUrl) {
        return NextResponse.redirect(signed.signedUrl, { status: 302 })
      }
    }

    return NextResponse.json({ error: 'Image could not be retrieved' }, { status: 502 })
  } catch (err) {
    console.error('[photos/download]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
