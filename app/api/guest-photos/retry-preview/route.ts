import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { generatePreview } from '@/lib/preview'

export const runtime = 'nodejs'

// POST /api/guest-photos/retry-preview
// Admin-only: resets preview_attempts and runs preview generation synchronously.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { photoId } = await request.json() as { photoId?: string }
    if (!photoId) return NextResponse.json({ error: 'Missing photoId' }, { status: 400 })

    const admin = createAdminSupabaseClient()

    const { data: photo } = await admin
      .from('guest_photos')
      .select('id, s3_key, mime_type, preview_key')
      .eq('id', photoId)
      .single()

    if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    if (photo.mime_type?.startsWith('video/')) return NextResponse.json({ error: 'Videos cannot have previews' }, { status: 400 })

    // Reset attempts so generatePreview will try again
    await admin
      .from('guest_photos')
      .update({ preview_attempts: 0, preview_key: null, preview_size: null })
      .eq('id', photoId)

    await generatePreview(photo.id, photo.s3_key, 0)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
