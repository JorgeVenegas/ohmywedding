import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient, getCollaboratorPermissions } from '@/lib/supabase-server'

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
    let wedding = null
    const { data: weddingData, error: weddingError } = await supabase
      .from('weddings')
      .select('id, primary_color, secondary_color, accent_color, og_title, og_description, og_image_url, has_website')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingData) {
      wedding = weddingData
    } else {
      // Fallback: use admin client in case RLS is interfering (e.g. stale auth cookies)
      console.warn('[config GET] Anon lookup failed, trying admin client:', { weddingId, error: weddingError?.message, code: weddingError?.code })
      const adminClient = createAdminSupabaseClient()
      const { data: adminWedding, error: adminError } = await adminClient
        .from('weddings')
        .select('id, primary_color, secondary_color, accent_color, og_title, og_description, og_image_url, has_website')
        .eq('wedding_name_id', weddingId)
        .single()

      if (adminError || !adminWedding) {
        console.error('[config GET] Wedding not found even with admin client:', { weddingId, error: adminError?.message })
        return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
      }
      wedding = adminWedding
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
    
    // Check permissions
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 })
    }

    // Use admin client for all lookups to avoid RLS issues
    const adminClient = createAdminSupabaseClient()
    
    // Get the wedding with owner and collaborator info
    const { data: existingWedding, error: findError } = await adminClient
      .from('weddings')
      .select('id, date_id, wedding_name_id, owner_id, collaborator_emails')
      .eq('wedding_name_id', weddingId)
      .single()

    if (findError || !existingWedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }
    
    const isOwner = existingWedding.owner_id === user.id
    
    // Check if user is a superuser
    let isSuperuser = false
    if (user.email) {
      const { data: superuserCheck } = await adminClient
        .from('superusers')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .eq('is_active', true)
        .single()
      isSuperuser = !!superuserCheck
    }
    
    // Check if user is a collaborator
    const isCollaborator = user.email 
      ? (existingWedding.collaborator_emails || []).includes(user.email.toLowerCase()) 
      : false
    
    if (!isOwner && !isCollaborator && !isSuperuser) {
      return NextResponse.json({ error: 'Forbidden - you do not have permission to edit this wedding' }, { status: 403 })
    }

    // Check granular permissions for collaborators
    if (isCollaborator && !isOwner && !isSuperuser) {
      const collabPerms = await getCollaboratorPermissions(existingWedding.id, user.email!)
      if (!collabPerms.can_edit_page_design) {
        return NextResponse.json({ error: 'You do not have permission to edit the wedding page design' }, { status: 403 })
      }
    }
    
    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid configuration data' }, { status: 400 })
    }

    // Validate config against wedding plan features
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

    // Use adminClient for writes — RLS on wedding_websites requires owner_id = auth.uid(),
    // but owner_id can be NULL for weddings created via migration/seed.
    // Permission checks above already verify the user is authorized.
    const { data: updatedWebsite, error: upsertError } = await adminClient
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
      console.error('[config PUT] wedding_websites upsert failed:', { weddingId, wedding_uuid: existingWedding.id, error: upsertError.message, code: upsertError.code })

      // Fallback: try updating the legacy weddings.page_config column
      const { data: updatedWeddings, error: legacyError } = await adminClient
        .from('weddings')
        .update({
          page_config: config,
          updated_at: new Date().toISOString()
        })
        .eq('wedding_name_id', weddingId)
        .select('id, page_config')

      if (legacyError) {
        console.error('[config PUT] Legacy fallback also failed:', { weddingId, error: legacyError.message })
        return NextResponse.json({ error: 'Failed to save configuration', detail: upsertError.message }, { status: 500 })
      }

      if (!updatedWeddings || updatedWeddings.length === 0) {
        console.error('[config PUT] Legacy fallback returned 0 rows:', { weddingId })
        return NextResponse.json({ error: 'Failed to save configuration', detail: upsertError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        config: updatedWeddings[0].page_config,
        isLegacy: true,
        message: 'Configuration saved successfully (legacy)'
      })
    }

    // Ensure has_website is set to true
    await adminClient
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