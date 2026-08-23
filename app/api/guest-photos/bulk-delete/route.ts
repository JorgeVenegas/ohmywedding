import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { deleteObject } from '@/lib/s3'
import { isSuperUser } from '@/lib/superadmin'

export const runtime = 'nodejs'

// DELETE /api/guest-photos/bulk-delete — admin only
// Body: { weddingNameId: string }
// Deletes all REJECTED photos (originals + previews) for the wedding.
// Intentionally restricted to rejected only — approved photos are never bulk-deleted here.
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { weddingNameId } = await request.json() as { weddingNameId: string }

    if (!weddingNameId) return NextResponse.json({ error: 'weddingNameId required' }, { status: 400 })

    const admin = createAdminSupabaseClient()

    const { data: wedding } = await admin
      .from('weddings')
      .select('id, owner_id, collaborator_emails')
      .eq('wedding_name_id', decodeURIComponent(weddingNameId))
      .single()

    if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

    const superuser = await isSuperUser(admin, { email: user.email })
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = (wedding.collaborator_emails as string[] | null)
      ?.includes(user.email?.toLowerCase() ?? '') ?? false

    if (!superuser && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: photos, error: fetchError } = await admin
      .from('guest_photos')
      .select('id, s3_key, preview_key')
      .eq('wedding_id', wedding.id)
      .eq('status', 'rejected')

    if (fetchError) return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
    if (!photos?.length) return NextResponse.json({ deleted: 0 })

    // Delete from S3 (best effort — don't abort if some fail)
    await Promise.allSettled(
      photos.flatMap(p => [
        p.s3_key     ? deleteObject(p.s3_key)     : null,
        p.preview_key ? deleteObject(p.preview_key) : null,
      ].filter(Boolean) as Promise<void>[])
    )

    const ids = photos.map(p => p.id)
    const { error: dbError } = await admin
      .from('guest_photos')
      .delete()
      .in('id', ids)

    if (dbError) return NextResponse.json({ error: 'Failed to delete records' }, { status: 500 })

    return NextResponse.json({ deleted: ids.length })
  } catch (err) {
    console.error('[bulk-delete]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
