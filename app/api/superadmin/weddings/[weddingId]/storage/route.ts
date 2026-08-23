import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { isSuperUser } from '@/lib/superadmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weddingId } = await params
  const adminClient = createAdminSupabaseClient()

  if (!(await isSuperUser(adminClient, { email: user.email }))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)
  const { data: wedding } = isUUID
    ? await adminClient.from('weddings').select('id, wedding_name_id, partner1_first_name, partner2_first_name').eq('id', weddingId).single()
    : await adminClient.from('weddings').select('id, wedding_name_id, partner1_first_name, partner2_first_name').eq('wedding_name_id', weddingId).single()

  if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })

  // Fetch DB storage breakdown + S3 file sizes in parallel
  const [storageRes, guestPhotosRes, imagesRes] = await Promise.all([
    adminClient.rpc('superadmin_wedding_storage', { p_wedding_id: wedding.id }),
    adminClient.from('guest_photos').select('file_size, preview_size').eq('wedding_id', wedding.id),
    adminClient.from('images').select('size').eq('wedding_id', wedding.id),
  ])

  type StorageRow = { table_name: string; row_count: number; size_bytes: number }
  const dbRows: StorageRow[] = (storageRes.data ?? []).filter((r: StorageRow) => r.row_count > 0)
  const totalDbBytes: number = dbRows.reduce((s: number, r: StorageRow) => s + (r.size_bytes ?? 0), 0)
  const totalRows: number = dbRows.reduce((s: number, r: StorageRow) => s + (r.row_count ?? 0), 0)

  const guestPhotoBytes = (guestPhotosRes.data ?? []).reduce(
    (sum, p) => sum + (p.file_size ?? 0) + (p.preview_size ?? 0), 0
  )
  const guestPhotoCount = guestPhotosRes.data?.length ?? 0

  const imagesBytes = (imagesRes.data ?? []).reduce(
    (sum, img) => sum + (img.size ?? 0), 0
  )
  const imagesCount = imagesRes.data?.length ?? 0

  const fileStorage: Array<{ label: string; bytes: number; count: number }> = []
  if (guestPhotoCount > 0) fileStorage.push({ label: 'Guest Photos', bytes: guestPhotoBytes, count: guestPhotoCount })
  if (imagesCount > 0) fileStorage.push({ label: 'Design Images', bytes: imagesBytes, count: imagesCount })

  return NextResponse.json({
    wedding_id: wedding.id,
    wedding_name_id: wedding.wedding_name_id,
    couple: [wedding.partner1_first_name, wedding.partner2_first_name].filter(Boolean).join(' & ') || wedding.wedding_name_id,
    // S3 file storage
    file_storage: fileStorage,
    total_file_bytes: fileStorage.reduce((s, r) => s + r.bytes, 0),
    // Database row storage
    db_breakdown: dbRows.sort((a: StorageRow, b: StorageRow) => b.size_bytes - a.size_bytes),
    total_db_bytes: totalDbBytes,
    total_rows: totalRows,
  })
}
