import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('Upload API - Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl
    })
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the uploaded file
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file.' },
        { status: 400 }
      )
    }

    // Validate file size (50MB max)
    if (file.size > 52428800) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = fileName // Don't include bucket name in path

    console.log('Upload attempt:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type
    })

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('wedding-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', {
        message: error.message,
        cause: error.cause,
        error
      })
      return NextResponse.json(
        { error: `Failed to upload image: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Upload successful:', {
      path: data.path,
      id: data.id
    })

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('wedding-images')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path,
      fileName: fileName
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}