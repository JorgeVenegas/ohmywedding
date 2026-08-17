import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  // Prevent SDK from injecting checksum headers into presigned PUT URLs.
  // Since v3.395 the default changed to WHEN_SUPPORTED, which adds
  // x-amz-checksum-crc32 to the signed query string — browsers can't
  // satisfy that requirement and S3 rejects the PUT with 403.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

const BUCKET = process.env.AWS_S3_BUCKET!

export function getPublicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_S3_BASE_URL
    ?? `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
  return `${base}/${key}`
}

export async function presignPut(
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn })
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  )
  return getPublicUrl(key)
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export function keyFromUrl(url: string): string | null {
  try {
    const base = process.env.NEXT_PUBLIC_S3_BASE_URL
      ?? `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
    if (!url.startsWith(base)) return null
    return url.slice(base.length + 1)
  } catch {
    return null
  }
}
