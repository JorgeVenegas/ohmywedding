import { NextRequest, NextResponse } from 'next/server'
import { putObject } from '@/lib/s3'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

const MAX_SIZE = 52428800 // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, images (JPG, PNG, WEBP), Word documents.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    const key = `contracts/${crypto.randomUUID()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await putObject(key, buffer, file.type)

    return NextResponse.json({ success: true, url, path: key, fileName: file.name })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
