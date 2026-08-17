import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { presignPut, getPublicUrl, deleteObject } from '@/lib/s3'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_SIZE = 52428800 // 50 MB

// POST /api/guest-photos — no auth required, open to guests
// Body: { weddingNameId, contentType, fileSize, fileName, uploaderName? }
// Returns: { presignedUrl, publicUrl, key, photoId }
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
      return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 400 })
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

    const ext = fileName?.split('.').pop()?.toLowerCase() ?? contentType.split('/')[1].replace('jpeg', 'jpg')
    const key = `${wedding.id}/guest-photos/${crypto.randomUUID()}.${ext}`

    const presignedUrl = await presignPut(key, contentType)
    const publicUrl = getPublicUrl(key)

    // Photos always start as pending — admin must approve before they show on the guest page.
    // Auto-approve only if moderation is explicitly disabled by the wedding owner.
    const autoApprove = settings.gallery_moderation_enabled === false
    const status = autoApprove ? 'approved' : 'pending'

    const insertPayload: Record<string, unknown> = {
      wedding_id: wedding.id,
      s3_key: key,
      url: publicUrl,
      uploader_name: uploaderName?.trim() || null,
      status,
      file_name: fileName,
      file_size: fileSize,
      mime_type: contentType,
    }
    // Only include metadata once the column exists (migration 20260815000002)
    if (metadata) insertPayload.metadata = metadata

    const { data: photo, error: dbError } = await admin
      .from('guest_photos')
      .insert(insertPayload)
      .select('id')
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 })
    }

    // Log to activity feed (non-blocking)
    Promise.resolve(
      admin.from('activity_logs').insert({
        wedding_id: wedding.id,
        activity_type: 'guest_photo_uploaded',
        description: uploaderName?.trim()
          ? `${uploaderName.trim()} uploaded a photo`
          : 'A guest uploaded a photo',
        metadata: { photo_id: photo.id, file_name: fileName ?? null, auto_approved: autoApprove },
      })
    ).catch(() => {})

    return NextResponse.json({ presignedUrl, publicUrl, key, photoId: photo.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/guest-photos?weddingNameId=<slug> — admin: fetch all photos for a wedding
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingNameId = searchParams.get('weddingNameId')
    const status = searchParams.get('status')

    if (!weddingNameId) {
      return NextResponse.json({ error: 'weddingNameId required' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    const { data: wedding, error: weddingError } = await admin
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', decodeURIComponent(weddingNameId))
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    let query = admin
      .from('guest_photos')
      .select('id, url, uploader_name, status, file_name, created_at')
      .eq('wedding_id', wedding.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
    }

    return NextResponse.json({ photos: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/guest-photos — admin: update photo status (approve / reject)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { photoId, status } = body as { photoId: string; status: 'approved' | 'rejected' }

    if (!photoId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    // Verify user has access to the wedding this photo belongs to
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

    let isSuperuser = false
    if (user.email) {
      const { data: su } = await admin.from('superusers').select('id').eq('email', user.email.toLowerCase()).eq('is_active', true).single()
      isSuperuser = !!su
    }

    if (!isOwner && !isCollaborator && !isSuperuser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await admin
      .from('guest_photos')
      .update({ status })
      .eq('id', photoId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/guest-photos?photoId=<id> — admin: delete a photo from S3 + DB
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const photoId = new URL(request.url).searchParams.get('photoId')
    if (!photoId) {
      return NextResponse.json({ error: 'photoId required' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    // Verify ownership and get the S3 key
    const { data: photo } = await admin
      .from('guest_photos')
      .select('id, s3_key, wedding_id')
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
    let isSuperuser = false
    if (user.email) {
      const { data: su } = await admin.from('superusers').select('id').eq('email', user.email.toLowerCase()).eq('is_active', true).single()
      isSuperuser = !!su
    }
    if (!isOwner && !isCollaborator && !isSuperuser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from S3 first, then remove the DB record
    await deleteObject(photo.s3_key)

    const { error } = await admin
      .from('guest_photos')
      .delete()
      .eq('id', photoId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete photo record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
