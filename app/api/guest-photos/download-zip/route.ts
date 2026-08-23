import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { isSuperUser } from '@/lib/superadmin'
import { ZipArchive } from 'archiver'
import { PassThrough, Readable } from 'stream'

export const runtime = 'nodejs'
export const maxDuration = 300

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
const BUCKET = process.env.AWS_S3_BUCKET!

// POST /api/guest-photos/download-zip — admin only
// Body: { weddingNameId: string, filter: 'approved' | 'all' }
// Streams a ZIP of all matching photos (originals).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { weddingNameId, filter } = await request.json() as { weddingNameId: string; filter: 'approved' | 'all' }

    if (!weddingNameId || !['approved', 'all'].includes(filter)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

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

    let query = admin
      .from('guest_photos')
      .select('id, s3_key, file_name, mime_type')
      .eq('wedding_id', wedding.id)
      .not('s3_key', 'is', null)

    if (filter === 'approved') query = query.eq('status', 'approved')

    const { data: photos, error } = await query

    if (error || !photos?.length) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    // Stream ZIP response
    const passThrough = new PassThrough()
    const archive = new ZipArchive({ zlib: { level: 1 } })
    archive.pipe(passThrough)

    // Kick off archive population in the background
    ;(async () => {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        try {
          const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: photo.s3_key! }))
          const ext = photo.file_name?.split('.').pop() ?? 'jpg'
          const name = photo.file_name ?? `photo-${i + 1}.${ext}`
          // Prefix with index so filenames are unique even if names clash
          archive.append(res.Body as Readable, { name: `${String(i + 1).padStart(4, '0')}_${name}` })
        } catch {
          // Skip files that fail to fetch rather than aborting the whole ZIP
        }
      }
      await archive.finalize()
    })()

    // Convert Node PassThrough to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        passThrough.on('data', chunk => controller.enqueue(chunk))
        passThrough.on('end', () => controller.close())
        passThrough.on('error', err => controller.error(err))
      },
    })

    const slug = weddingNameId.replace(/[^a-z0-9-]/gi, '-')
    const label = filter === 'approved' ? 'approved' : 'all'

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${slug}-photos-${label}.zip"`,
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('[download-zip]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
