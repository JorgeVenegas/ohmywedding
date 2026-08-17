import { NextRequest, NextResponse } from 'next/server'
import { putObject, getPublicUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image file.' }, { status: 400 })
    }

    if (file.size > 52428800) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const formWeddingId = formData.get('weddingId') as string | null
    const prefix = formWeddingId ? `${formWeddingId}/wedding-images` : 'wedding-images'
    const key = `${prefix}/${crypto.randomUUID()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await putObject(key, buffer, file.type)

    return NextResponse.json({ success: true, url, path: key, fileName: file.name })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
