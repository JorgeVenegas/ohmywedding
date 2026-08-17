import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { putObject, deleteObject, keyFromUrl } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const guestId = formData.get('guestId') as string
    const weddingNameId = formData.get('weddingNameId') as string

    if (!file || !guestId || !weddingNameId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, guestId, or weddingNameId' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images and PDF files are allowed.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'pdf'
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `travel-tickets/${weddingNameId}/${guestId}/${Date.now()}-${sanitized}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await putObject(key, buffer, file.type)

    const { error: updateError } = await supabase
      .from('guests')
      .update({ ticket_attachment_url: url })
      .eq('id', guestId)

    if (updateError) {
      return NextResponse.json(
        { error: 'File uploaded but failed to update guest record', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url, path: key, message: 'Travel ticket uploaded successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get('guestId')

    if (!guestId) return NextResponse.json({ error: 'Missing guestId parameter' }, { status: 400 })

    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('ticket_attachment_url')
      .eq('id', guestId)
      .single()

    if (fetchError || !guest?.ticket_attachment_url) {
      return NextResponse.json({ error: 'Guest not found or no ticket attached' }, { status: 404 })
    }

    const key = keyFromUrl(guest.ticket_attachment_url)
    if (key) await deleteObject(key)

    const { error: updateError } = await supabase
      .from('guests')
      .update({ ticket_attachment_url: null })
      .eq('id', guestId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update guest record', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Travel ticket deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
