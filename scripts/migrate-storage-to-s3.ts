/**
 * Migrates all files from the Supabase `wedding-images` bucket to S3,
 * then updates every stored URL in the database.
 *
 * Usage:
 *   npx tsx scripts/migrate-storage-to-s3.ts
 *
 * Run against staging first. Keep Supabase bucket alive for 30 days after
 * cutover as a read-only fallback before removing it.
 */

import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_BUCKET = 'wedding-images'

// Columns in each table that may contain Supabase storage URLs.
// Add any missing ones if you discover more during the audit.
const DB_URL_COLUMNS: Array<{ table: string; columns: string[] }> = [
  { table: 'weddings',   columns: ['cover_image_url', 'logo_url', 'og_image_url', 'background_image_url'] },
  { table: 'guests',     columns: ['ticket_attachment_url', 'photo_url'] },
  { table: 'suppliers',  columns: ['contract_url', 'logo_url'] },
  { table: 'events',     columns: ['image_url'] },
  { table: 'dishes',     columns: ['image_url'] },
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const awsRegion = process.env.AWS_REGION!
  const awsBucket = process.env.AWS_S3_BUCKET!
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL
    ?? `https://${awsBucket}.s3.${awsRegion}.amazonaws.com`

  if (!supabaseUrl || !supabaseServiceKey || !awsRegion || !awsBucket) {
    console.error('Missing required environment variables. Check .env.local.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const s3 = new S3Client({
    region: awsRegion,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const supabaseUrlPrefix = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/`

  // ─── Step 1: List all files in Supabase bucket ───────────────────────────

  console.log('\n── Step 1: Listing Supabase bucket files...')

  const allFiles: { name: string; id: string }[] = []
  let offset = 0
  const pageSize = 100

  while (true) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list('', { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } })

    if (error) { console.error('Failed to list bucket:', error.message); process.exit(1) }
    if (!data || data.length === 0) break

    // Filter out folders (they have no id)
    allFiles.push(...data.filter(f => f.id).map(f => ({ name: f.name, id: f.id })))
    offset += pageSize
    if (data.length < pageSize) break
  }

  // Recursively list subfolders (audio/, contracts/, travel-tickets/)
  const subfolders = ['audio', 'contracts', 'travel-tickets']
  for (const folder of subfolders) {
    let folderOffset = 0
    while (true) {
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .list(folder, { limit: pageSize, offset: folderOffset })

      if (error || !data || data.length === 0) break

      allFiles.push(...data.filter(f => f.id).map(f => ({ name: `${folder}/${f.name}`, id: f.id })))
      folderOffset += pageSize
      if (data.length < pageSize) break
    }
  }

  console.log(`   Found ${allFiles.length} files to migrate.`)

  // ─── Step 2: Copy each file to S3 ────────────────────────────────────────

  console.log('\n── Step 2: Copying files to S3...')

  let copied = 0
  let failed = 0
  const urlMap: Record<string, string> = {}

  for (const file of allFiles) {
    const oldUrl = `${supabaseUrlPrefix}${file.name}`
    const s3Key = file.name
    const newUrl = `${s3BaseUrl}/${s3Key}`

    try {
      const res = await fetch(oldUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const buffer = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get('content-type') ?? 'application/octet-stream'

      await s3.send(new PutObjectCommand({
        Bucket: awsBucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }))

      urlMap[oldUrl] = newUrl
      copied++
      if (copied % 20 === 0) console.log(`   ${copied}/${allFiles.length} copied...`)
    } catch (err) {
      console.error(`   FAILED: ${file.name} —`, err instanceof Error ? err.message : err)
      failed++
    }
  }

  console.log(`   Done: ${copied} copied, ${failed} failed.`)

  if (failed > 0) {
    console.warn('\n⚠️  Some files failed. Fix errors above before updating the database.')
    process.exit(1)
  }

  // ─── Step 3: Update DB columns ───────────────────────────────────────────

  console.log('\n── Step 3: Updating database URLs...')

  let totalUpdated = 0

  for (const { table, columns } of DB_URL_COLUMNS) {
    for (const column of columns) {
      // Fetch all rows where this column contains a Supabase storage URL
      const { data: rows, error: fetchError } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .like(column, `${supabaseUrlPrefix}%`)

      if (fetchError) {
        // Column may not exist in this table — skip silently
        continue
      }

      if (!rows || rows.length === 0) continue

      const typedRows = rows as unknown as Array<Record<string, string>>

      for (const row of typedRows) {
        const oldUrl = row[column]
        const newUrl = urlMap[oldUrl]
        if (!newUrl) continue

        const { error: updateError } = await supabase
          .from(table)
          .update({ [column]: newUrl })
          .eq('id', row['id'])

        if (updateError) {
          console.error(`   Failed to update ${table}.${column} for id=${row['id']}:`, updateError.message)
        } else {
          totalUpdated++
        }
      }

      console.log(`   ${table}.${column}: updated ${rows.length} rows`)
    }
  }

  console.log(`\n✓ Migration complete. ${copied} files copied, ${totalUpdated} DB rows updated.`)
  console.log('\nNext steps:')
  console.log('  1. Spot-check a few URLs in the app to confirm they resolve.')
  console.log('  2. Keep the Supabase bucket read-only for 30 days before removing.')
  console.log('  3. Add NEXT_PUBLIC_S3_BASE_URL to your Vercel env vars.')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
