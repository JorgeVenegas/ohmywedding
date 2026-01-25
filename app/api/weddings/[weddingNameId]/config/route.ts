import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/weddings/[weddingNameId]/config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId } = await params

    const { data: wedding, error } = await supabase
      .from('weddings')
      .select('page_config, primary_color, secondary_color, accent_color, og_title, og_description, og_image_url')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (error) {
      console.error('Error fetching wedding config:', error)
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    // Merge wedding colors into the page config if they exist
    const pageConfig = wedding.page_config || {}
    
    // If the page config doesn't have colors set, use the wedding's colors
    if (!pageConfig.siteSettings?.theme?.colors || 
        (!pageConfig.siteSettings.theme.colors.primary && 
         !pageConfig.siteSettings.theme.colors.secondary && 
         !pageConfig.siteSettings.theme.colors.accent)) {
      pageConfig.siteSettings = pageConfig.siteSettings || {}
      pageConfig.siteSettings.theme = pageConfig.siteSettings.theme || {}
      pageConfig.siteSettings.theme.colors = {
        ...pageConfig.siteSettings.theme.colors,
        primary: wedding.primary_color || pageConfig.siteSettings?.theme?.colors?.primary,
        secondary: wedding.secondary_color || pageConfig.siteSettings?.theme?.colors?.secondary,
        accent: wedding.accent_color || pageConfig.siteSettings?.theme?.colors?.accent
      }
    }

    return NextResponse.json({
      config: pageConfig,
      wedding: {
        og_title: wedding.og_title,
        og_description: wedding.og_description,
        og_image_url: wedding.og_image_url
      }
    })

  } catch (error) {
    console.error('Error in GET /api/weddings/config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/weddings/[weddingNameId]/config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId } = await params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // First, check if the wedding exists and get owner info
    const { data: existingWedding, error: findError } = await supabase
      .from('weddings')
      .select('id, date_id, wedding_name_id, owner_id')
      .eq('wedding_name_id', weddingNameId)
      .single()
    
    if (findError || !existingWedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }
    
    // Check permissions
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 })
    }
    
    const isOwner = existingWedding.owner_id === user.id
    
    // Check if user is a superuser
    let isSuperuser = false
    if (user.email) {
      const { data: superuserCheck } = await supabase
        .from('superusers')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .eq('is_active', true)
        .single()
      isSuperuser = !!superuserCheck
    }
    
    // Check if user is a collaborator
    let isCollaborator = false
    try {
      const { data: weddingWithCollabs } = await supabase
        .from('weddings')
        .select('collaborator_emails')
        .eq('wedding_name_id', weddingNameId)
        .single()
      
      if (weddingWithCollabs?.collaborator_emails && user.email) {
        isCollaborator = weddingWithCollabs.collaborator_emails.includes(user.email.toLowerCase())
      }
    } catch {
      // Column doesn't exist yet
    }
    
    if (!isOwner && !isCollaborator && !isSuperuser) {
      return NextResponse.json({ error: 'Forbidden - you do not have permission to edit this wedding' }, { status: 403 })
    }
    
    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid configuration data' }, { status: 400 })
    }

    const { data: updatedWeddings, error } = await supabase
      .from('weddings')
      .update({
        page_config: config,
        updated_at: new Date().toISOString()
      })
      .eq('wedding_name_id', weddingNameId)
      .select('id, page_config')

    if (error) {
      console.error('Error updating wedding config:', error)
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }

    if (!updatedWeddings || updatedWeddings.length === 0) {
      console.error('No rows updated - wedding might not exist')
      return NextResponse.json({ error: 'Wedding not found or update failed' }, { status: 404 })
    }

    const wedding = updatedWeddings[0]

    return NextResponse.json({
      success: true,
      config: wedding.page_config,
      message: 'Configuration saved successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/weddings/config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}