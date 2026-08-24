import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { deleteObject } from '@/lib/s3'

// POST /api/guest-photos/cancel
// No auth — called by the guest's browser when an S3 upload fails after the DB record was created.
// Validates with photoId + s3Key (both server-generated UUIDs, not guessable).
// Only deletes records that were never successfully uploaded (preview_key is null, preview_attempts = 0).
export async function POST(request: NextRequest) {
  try {
    const { photoId, s3Key } = await request.json() as { photoId?: string; s3Key?: string }
    if (!photoId || !s3Key) return NextResponse.json({ ok: true })

    const admin = createAdminSupabaseClient()

    const { data: photo } = await admin
      .from('guest_photos')
      .select('id, s3_key, preview_key, preview_attempts')
      .eq('id', photoId)
      .eq('s3_key', s3Key)
      .is('preview_key', null)
      .eq('preview_attempts', 0)
      .single()

    // Silently succeed if record not found or already processed
    if (!photo) return NextResponse.json({ ok: true })

    // Best-effort S3 cleanup (file may not exist — that's expected)
    void deleteObject(s3Key).catch(() => {})

    await admin.from('guest_photos').delete().eq('id', photoId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
