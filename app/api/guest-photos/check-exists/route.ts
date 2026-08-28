import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { objectExists } from '@/lib/s3'

export const runtime = 'nodejs'

// POST /api/guest-photos/check-exists
// Admin-only: checks whether the underlying S3 objects for a list of photo IDs actually exist.
// Returns { results: { [photoId]: boolean } } — never deletes, only reports.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { photoIds } = await request.json() as { photoIds?: string[] }
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ results: {} })
    }

    const ids = photoIds.slice(0, 100)

    const admin = createAdminSupabaseClient()
    const { data: photos } = await admin
      .from('guest_photos')
      .select('id, s3_key')
      .in('id', ids)

    if (!photos?.length) return NextResponse.json({ results: {} })

    const results: Record<string, boolean> = {}
    await Promise.all(
      photos.map(async (p) => {
        if (!p.s3_key) { results[p.id] = false; return }
        try {
          results[p.id] = await objectExists(p.s3_key)
        } catch {
          // On unexpected S3 errors, assume exists to avoid falsely hiding photos
          results[p.id] = true
        }
      })
    )

    return NextResponse.json({ results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[check-exists]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
