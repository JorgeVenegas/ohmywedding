import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { presignPut, presignGet, presignDownload, deleteObject } from '@/lib/s3'
import { invokeGeneratePreview } from '@/lib/lambda'
import { isSuperUser } from '@/lib/superadmin'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/mov']
const MAX_SIZE = 524288000 // 500 MB (videos)
// After this many failed attempts, show "preview not available" instead of retrying
const MAX_PREVIEW_ATTEMPTS = 2

// POST /api/guest-photos — no auth required, open to guests
// Returns presigned S3 PUT URL for direct upload + a DB record ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weddingNameId, contentType, fileSize, fileName, uploaderName, metadata } = body as {
      weddingNameId: string
      contentType: string
      fileSize: number
      fileName?: string
      uploaderName?: string
      metadata?: Record<string, unknown>
    }

    if (!weddingNameId || !contentType || !fileSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (fileSize > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 500 MB limit' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    const { data: wedding, error: weddingError } = await admin
      .from('weddings')
      .select('id, wedding_name_id')
      .eq('wedding_name_id', decodeURIComponent(weddingNameId))
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    const { data: settings } = await admin
      .from('wedding_settings')
      .select('gallery_allow_guest_uploads, gallery_moderation_enabled')
      .eq('wedding_id', wedding.id)
      .single()

    if (!settings?.gallery_allow_guest_uploads) {
      return NextResponse.json({ error: 'Guest uploads are not enabled for this wedding' }, { status: 403 })
    }

    const isVideo = contentType.startsWith('video/')
    const ext = fileName?.split('.').pop()?.toLowerCase()
      ?? contentType.split('/')[1].replace('jpeg', 'jpg').replace('quicktime', 'mov')

    // New key format — Lambda S3 trigger filters on "guest-photos/" prefix
    // and detects originals by the "/original." segment
    const uuid = crypto.randomUUID()
    const key = `guest-photos/${wedding.id}/${uuid}/original.${ext}`

    const presignedUrl = await presignPut(key, contentType)

    const autoApprove = settings.gallery_moderation_enabled === false
    const status = autoApprove ? 'approved' : 'pending'

    const insertPayload: Record<string, unknown> = {
      wedding_id: wedding.id,
      s3_key: key,
      url: '',           // no public URL — access is via presigned URLs only
      uploader_name: uploaderName?.trim() || null,
      status,
      file_name: fileName,
      file_size: fileSize,
      mime_type: contentType,
      preview_attempts: 0,
    }
    if (metadata) insertPayload.metadata = metadata

    const { data: photo, error: dbError } = await admin
      .from('guest_photos')
      .insert(insertPayload)
      .select('id')
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 })
    }

    Promise.resolve(
      admin.from('activity_logs').insert({
        wedding_id: wedding.id,
        activity_type: 'guest_photo_uploaded',
        description: uploaderName?.trim()
          ? `${uploaderName.trim()} uploaded a ${isVideo ? 'video' : 'photo'}`
          : `A guest uploaded a ${isVideo ? 'video' : 'photo'}`,
        metadata: { photo_id: photo.id, file_name: fileName ?? null, auto_approved: autoApprove },
      })
    ).catch(() => {})

    return NextResponse.json({ presignedUrl, key, photoId: photo.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/guest-photos?weddingNameId=<slug> — admin only
// Returns all photos for the wedding with short-lived presigned URLs for display + download.
// If a photo has no preview yet and hasn't exceeded retry limit, Lambda is invoked async.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const weddingNameId = searchParams.get('weddingNameId')
    const status = searchParams.get('status')

    if (!weddingNameId) {
      return NextResponse.json({ error: 'weddingNameId required' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    const { data: wedding, error: weddingError } = await admin
      .from('weddings')
      .select('id, owner_id, collaborator_emails')
      .eq('wedding_name_id', decodeURIComponent(weddingNameId))
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

    let query = admin
      .from('guest_photos')
      .select('id, s3_key, preview_key, preview_attempts, uploader_name, status, file_name, file_size, mime_type, created_at, metadata')
      .eq('wedding_id', wedding.id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })

    const photos = data ?? []

    // Generate presigned URLs and trigger Lambda for missing previews
    const enriched = await Promise.all(
      photos.map(async (photo) => {
        let displayUrl: string | null = null
        let previewStatus: 'ready' | 'generating' | 'unavailable' = 'unavailable'

        if (photo.preview_key) {
          // Preview is ready — short-lived view URL
          displayUrl = await presignGet(photo.preview_key, 900).catch(() => null)
          previewStatus = 'ready'
        } else if (photo.s3_key && photo.preview_attempts < MAX_PREVIEW_ATTEMPTS) {
          // Preview missing but within retry budget — invoke Lambda async, return original as fallback
          invokeGeneratePreview(photo.s3_key).catch(() => {})
          // Also increment preview_attempts immediately so we don't spam Lambda on repeated loads
          void admin.from('guest_photos')
            .update({ preview_attempts: photo.preview_attempts + 1 })
            .eq('id', photo.id)
          displayUrl = photo.s3_key ? await presignGet(photo.s3_key, 900).catch(() => null) : null
          previewStatus = 'generating'
        }
        // else: preview_attempts >= MAX — leave displayUrl null, previewStatus 'unavailable'

        // Original download URL (always generated when s3_key exists)
        const downloadUrl = photo.s3_key
          ? await presignDownload(photo.s3_key, photo.file_name ?? 'photo', 3600).catch(() => null)
          : null

        return {
          id: photo.id,
          uploader_name: photo.uploader_name,
          status: photo.status,
          file_name: photo.file_name,
          file_size: photo.file_size,
          mime_type: photo.mime_type,
          created_at: photo.created_at,
          metadata: photo.metadata,
          display_url: displayUrl,
          download_url: downloadUrl,
          preview_status: previewStatus,
        }
      })
    )

    return NextResponse.json({ photos: enriched })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/guest-photos — admin: update photo status (approve / reject)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { photoId, status } = body as { photoId: string; status: 'approved' | 'rejected' }

    if (!photoId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    const { data: photo } = await admin
      .from('guest_photos')
      .select('id, wedding_id')
      .eq('id', photoId)
      .single()

    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: wedding } = await admin
      .from('weddings')
      .select('owner_id, collaborator_emails')
      .eq('id', photo.wedding_id)
      .single()

    if (!wedding) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() ?? '') ?? false
    const superuser = await isSuperUser(admin, { email: user.email })

    if (!isOwner && !isCollaborator && !superuser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await admin.from('guest_photos').update({ status }).eq('id', photoId)
    if (error) return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/guest-photos?photoId=<id> — admin: delete photo from S3 + DB
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const photoId = new URL(request.url).searchParams.get('photoId')
    if (!photoId) return NextResponse.json({ error: 'photoId required' }, { status: 400 })

    const admin = createAdminSupabaseClient()

    const { data: photo } = await admin
      .from('guest_photos')
      .select('id, s3_key, preview_key, wedding_id')
      .eq('id', photoId)
      .single()

    if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: wedding } = await admin
      .from('weddings')
      .select('owner_id, collaborator_emails')
      .eq('id', photo.wedding_id)
      .single()

    if (!wedding) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() ?? '') ?? false
    const superuser = await isSuperUser(admin, { email: user.email })

    if (!isOwner && !isCollaborator && !superuser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete original + preview from S3 (best effort)
    await Promise.allSettled([
      photo.s3_key ? deleteObject(photo.s3_key) : Promise.resolve(),
      photo.preview_key ? deleteObject(photo.preview_key) : Promise.resolve(),
    ])

    const { error } = await admin.from('guest_photos').delete().eq('id', photoId)
    if (error) return NextResponse.json({ error: 'Failed to delete photo record' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
