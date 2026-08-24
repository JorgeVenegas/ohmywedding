import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { generatePreview } from '@/lib/preview'

export const runtime = 'nodejs'

const MAX_PREVIEW_ATTEMPTS = 2

// POST /api/guest-photos/trigger-preview
// Called by the guest's browser right after a successful S3 upload.
// No user auth — photoId + s3Key together validate the request against the DB.
// Generates the preview synchronously — the caller fires this request without awaiting the response.
export async function POST(request: NextRequest) {
  try {
    const { photoId, s3Key } = await request.json() as { photoId?: string; s3Key?: string }

    if (!photoId || !s3Key) {
      return NextResponse.json({ error: 'Missing photoId or s3Key' }, { status: 400 })
    }

    const admin = createAdminSupabaseClient()

    const { data: photo } = await admin
      .from('guest_photos')
      .select('id, s3_key, mime_type, preview_key, preview_attempts')
      .eq('id', photoId)
      .eq('s3_key', s3Key)
      .single()

    // Silently ignore invalid/unknown photoId+s3Key combos (prevents enumeration)
    if (!photo) return NextResponse.json({ ok: true })

    // Videos — Sharp can't generate previews for them
    if (photo.mime_type?.startsWith('video/')) return NextResponse.json({ ok: true })

    // Already done or exhausted retries
    if (photo.preview_key || photo.preview_attempts >= MAX_PREVIEW_ATTEMPTS) {
      return NextResponse.json({ ok: true })
    }

    // Await directly — after() is unreliable in some environments (dev server, self-hosted).
    // The client calls this fire-and-forget so response latency doesn't matter.
    await generatePreview(photo.id, photo.s3_key, photo.preview_attempts)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
