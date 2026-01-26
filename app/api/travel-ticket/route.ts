import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
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

    // Validate file type (allow images and PDFs for tickets)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDF files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for tickets)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedFileName}`
    const filePath = `travel-tickets/${weddingNameId}/${guestId}/${fileName}`

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wedding-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('wedding-images')
      .getPublicUrl(filePath)

    // Update guest record with ticket URL
    const { error: updateError } = await supabase
      .from('guests')
      .update({ ticket_attachment_url: publicUrl })
      .eq('id', guestId)

    if (updateError) {
      // File was uploaded but DB update failed - consider cleanup
      return NextResponse.json(
        { error: 'File uploaded but failed to update guest record', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      message: 'Travel ticket uploaded successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Optional: DELETE endpoint to remove uploaded ticket
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get('guestId')
    
    if (!guestId) {
      return NextResponse.json(
        { error: 'Missing guestId parameter' },
        { status: 400 }
      )
    }

    // Get current ticket URL
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('ticket_attachment_url')
      .eq('id', guestId)
      .single()

    if (fetchError || !guest?.ticket_attachment_url) {
      return NextResponse.json(
        { error: 'Guest not found or no ticket attached' },
        { status: 404 }
      )
    }

    // Extract file path from URL
    const url = new URL(guest.ticket_attachment_url)
    const pathParts = url.pathname.split('/wedding-images/')
    const filePath = pathParts[1]

    if (filePath) {
      // Delete from storage
      await supabase.storage
        .from('wedding-images')
        .remove([filePath])
    }

    // Clear ticket URL from guest record
    const { error: updateError } = await supabase
      .from('guests')
      .update({ ticket_attachment_url: null })
      .eq('id', guestId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update guest record', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Travel ticket deleted successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
