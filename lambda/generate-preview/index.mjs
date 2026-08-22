/**
 * Lambda: generate-guest-photo-preview
 *
 * Triggered by:
 *   1. S3 ObjectCreated event on prefix "guest-photos/" (automatic on every upload)
 *   2. Direct async invocation from Next.js API with payload { key: "<s3-key>" } (retry path)
 *
 * For each original, generates a 1200px-wide WebP preview, uploads it next to the
 * original, and updates the guest_photos row in Supabase.
 *
 * Preview not available: if preview_attempts reaches MAX_ATTEMPTS in the DB, the
 * Next.js API stops invoking Lambda and shows "preview not available" to the user.
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.S3_BUCKET
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PREVIEW_WIDTH = 1200

// ─── Key helpers ─────────────────────────────────────────────────────────────

function isPreviewKey(key) {
  return key.endsWith('/preview.webp') || key.includes('-preview.')
}

function isGuestPhotoKey(key) {
  return key.startsWith('guest-photos/') || key.includes('/guest-photos/')
}

/**
 * Derive the preview key from an original key.
 * New format:  guest-photos/{weddingId}/{uuid}/original.{ext}
 *              → guest-photos/{weddingId}/{uuid}/preview.webp
 * Old format:  {weddingId}/guest-photos/{uuid}.{ext}
 *              → {weddingId}/guest-photos/{uuid}-preview.webp
 */
function previewKey(originalKey) {
  if (/\/original\.[^/]+$/.test(originalKey)) {
    return originalKey.replace(/\/original\.[^/]+$/, '/preview.webp')
  }
  return originalKey.replace(/\.[^./]+$/, '-preview.webp')
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function supabaseRequest(path, method = 'GET', body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'PATCH' ? 'return=minimal' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supabase ${method} ${path} → ${res.status}: ${text}`)
  }
  return method === 'GET' ? res.json() : null
}

async function findPhoto(s3Key) {
  const rows = await supabaseRequest(
    `guest_photos?s3_key=eq.${encodeURIComponent(s3Key)}&select=id,preview_attempts&limit=1`,
  )
  return rows?.[0] ?? null
}

async function updatePhoto(id, patch) {
  await supabaseRequest(`guest_photos?id=eq.${id}`, 'PATCH', patch)
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  let originalKey

  if (event.Records?.[0]?.s3) {
    // S3 event trigger
    originalKey = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, ' '),
    )
    if (isPreviewKey(originalKey) || !isGuestPhotoKey(originalKey)) {
      console.log('Skipping non-original key:', originalKey)
      return
    }
  } else if (event.key) {
    // Direct invocation from Next.js API (retry path)
    originalKey = event.key
  } else {
    console.error('Unknown event format:', JSON.stringify(event))
    return
  }

  const preview = previewKey(originalKey)
  console.log(`Generating preview: ${originalKey} → ${preview}`)

  const photo = await findPhoto(originalKey).catch(() => null)

  try {
    // Download original from S3
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: originalKey }))
    const chunks = []
    for await (const chunk of Body) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)

    // Generate preview with Sharp
    const previewBuffer = await sharp(buffer)
      .resize(PREVIEW_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    // Upload preview
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: preview,
        Body: previewBuffer,
        ContentType: 'image/webp',
      }),
    )

    // Update DB — mark preview ready
    if (photo) {
      await updatePhoto(photo.id, {
        preview_key: preview,
        preview_size: previewBuffer.length,
        preview_attempts: photo.preview_attempts + 1,
      })
    }

    console.log(`Done: ${preview} (${previewBuffer.length} bytes)`)
  } catch (err) {
    console.error('Preview generation failed:', err)
    // Increment attempts so the app doesn't retry forever
    if (photo) {
      await updatePhoto(photo.id, {
        preview_attempts: photo.preview_attempts + 1,
      }).catch(console.error)
    }
  }
}
