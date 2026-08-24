import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET!
const PREVIEW_WIDTH = 1200

function previewKey(originalKey: string): string {
  if (/\/original\.[^/]+$/.test(originalKey)) {
    return originalKey.replace(/\/original\.[^/]+$/, '/preview.webp')
  }
  return originalKey.replace(/\.[^./]+$/, '-preview.webp')
}

/**
 * Generates a 1200px WebP preview for a guest photo original.
 * Updates the DB on success and increments preview_attempts on both success and failure.
 * Returns true on success, false on failure.
 */
export async function generatePreview(photoId: string, s3Key: string, currentAttempts: number): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminSupabaseClient()

  try {
    const preview = previewKey(s3Key)

    // Download original
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }))
    const chunks: Uint8Array[] = []
    for await (const chunk of Body as AsyncIterable<Uint8Array>) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)

    // Lazy-import Sharp — native module, avoid loading at module init time
    const sharp = (await import('sharp')).default
    const previewBuffer = await sharp(buffer, { limitInputPixels: false, failOnError: false })
      .rotate()
      .resize(PREVIEW_WIDTH, undefined, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    // Upload preview
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: preview,
      Body: previewBuffer,
      ContentType: 'image/webp',
    }))

    // Mark preview ready
    await admin.from('guest_photos').update({
      preview_key: preview,
      preview_size: previewBuffer.length,
      preview_attempts: currentAttempts + 1,
    }).eq('id', photoId)

    console.log(`[preview] generated ${preview} (${previewBuffer.length} bytes)`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[preview] failed for ${s3Key}: ${message}`)
    void admin.from('guest_photos')
      .update({ preview_attempts: currentAttempts + 1 })
      .eq('id', photoId)
    return { ok: false, error: message }
  }
}
