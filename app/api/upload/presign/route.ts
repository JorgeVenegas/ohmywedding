import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { presignPut, getPublicUrl } from '@/lib/s3'

export const runtime = 'nodejs'

const ALLOWED_TYPES: Record<string, string[]> = {
  'wedding-images': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  'audio':          ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'audio/flac'],
  'contracts':      ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}

const MAX_SIZE = 52428800 // 50 MB

type UploadFolder = keyof typeof ALLOWED_TYPES

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { contentType, folder, fileSize, fileName, weddingId } = body as {
    contentType: string
    folder: UploadFolder
    fileSize: number
    fileName?: string
    weddingId?: string
  }

  if (!ALLOWED_TYPES[folder]) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  }

  if (!ALLOWED_TYPES[folder].includes(contentType)) {
    return NextResponse.json({ error: `File type ${contentType} not allowed in ${folder}` }, { status: 400 })
  }

  if (fileSize > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 400 })
  }

  const ext = fileName?.split('.').pop() ?? contentType.split('/')[1].replace('jpeg', 'jpg')
  const prefix = weddingId ? `${weddingId}/${folder}` : folder
  const key = `${prefix}/${crypto.randomUUID()}.${ext}`

  const presignedUrl = await presignPut(key, contentType)
  const publicUrl = getPublicUrl(key)

  return NextResponse.json({ presignedUrl, publicUrl, key })
}
