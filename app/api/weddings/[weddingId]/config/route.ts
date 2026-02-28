import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/weddings/[weddingId]/config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingId } = await params

    // First, get the wedding to resolve ID and get colors
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, primary_color, secondary_color, accent_color, og_title, og_description, og_image_url, has_website')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    let pageConfig: Record<string, any> = {}
    let isLegacy = false

    // Try to read from wedding_websites table first
    const { data: websiteData } = await supabase
      .from('wedding_websites')
      .select('page_config')
      .eq('wedding_id', wedding.id)
      .single()

    if (websiteData) {
      pageConfig = websiteData.page_config || {}
      isLegacy = false
    } else {
      // Fallback: read from legacy weddings.page_config column
      const { data: legacyWedding } = await supabase
        .from('weddings')
        .select('page_config')
        .eq('id', wedding.id)
        .single()

      if (legacyWedding?.page_config && typeof legacyWedding.page_config === 'object' && Object.keys(legacyWedding.page_config).length > 0) {
        pageConfig = legacyWedding.page_config
        isLegacy = true
      }
    }

    // Merge wedding colors into the page config if they exist
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
      isLegacy,
      wedding: {
        og_title: wedding.og_title,
        og_description: wedding.og_description,
        og_image_url: wedding.og_image_url
      }
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/weddings/[weddingId]/config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingId } = await params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // First, check if the wedding exists and get owner info
    const { data: existingWedding, error: findError } = await supabase
      .from('weddings')
      .select('id, date_id, wedding_name_id, owner_id')
      .eq('wedding_name_id', weddingId)
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
        .eq('wedding_name_id', weddingId)
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

    // Validate config against wedding plan features
    const adminClient = createAdminSupabaseClient()
    
    // Get wedding plan
    const { data: weddingSubscription } = await adminClient
      .from('wedding_subscriptions')
      .select('plan')
      .eq('wedding_id', existingWedding.id)
      .maybeSingle()
    
    const plan = weddingSubscription?.plan || 'free'
    
    // Get plan features
    const { data: planFeatures } = await adminClient
      .from('plan_features')
      .select('feature_key, enabled')
      .eq('plan', plan)
    
    const features = planFeatures || []
    
    // Helper to check if a feature is enabled
    const isFeatureEnabled = (featureKey: string) => {
      const feature = features.find(f => f.feature_key === featureKey)
      return feature?.enabled || false
    }

    const { data: updatedWebsite, error: upsertError } = await supabase
      .from('wedding_websites')
      .upsert({
        wedding_id: existingWedding.id,
        page_config: config,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wedding_id'
      })
      .select('page_config, is_legacy')
      .single()

    if (upsertError) {
      // Fallback: try updating the legacy weddings.page_config column
      const { data: updatedWeddings, error: legacyError } = await supabase
        .from('weddings')
        .update({
          page_config: config,
          updated_at: new Date().toISOString()
        })
        .eq('wedding_name_id', weddingId)
        .select('id, page_config')

      if (legacyError) {
        return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
      }

      if (!updatedWeddings || updatedWeddings.length === 0) {
        return NextResponse.json({ error: 'Wedding not found or update failed' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        config: updatedWeddings[0].page_config,
        isLegacy: true,
        message: 'Configuration saved successfully (legacy)'
      })
    }

    // Ensure has_website is set to true
    await supabase
      .from('weddings')
      .update({ has_website: true, updated_at: new Date().toISOString() })
      .eq('id', existingWedding.id)

    return NextResponse.json({
      success: true,
      config: updatedWebsite?.page_config || config,
      isLegacy: updatedWebsite?.is_legacy || false,
      message: 'Configuration saved successfully'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}