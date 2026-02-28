import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createDefaultPageConfig } from '@/lib/page-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/weddings/[weddingId]/website - Create website for an existing wedding
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingId } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve wedding - support both UUID and slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingId)
    const query = supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails, wedding_name_id')
    
    const { data: wedding, error: weddingError } = isUUID
      ? await query.eq('id', weddingId).single()
      : await query.eq('wedding_name_id', weddingId).single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() || '')
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if website already exists
    const { data: existingWebsite } = await supabase
      .from('wedding_websites')
      .select('id')
      .eq('wedding_id', wedding.id)
      .single()

    if (existingWebsite) {
      return NextResponse.json({ error: 'Website already exists. Use PUT /config to update.' }, { status: 409 })
    }

    // Parse request body
    const body = await request.json()

    // Build page config from user selections
    const defaultPageConfig = createDefaultPageConfig()
    const pageConfig = {
      ...defaultPageConfig,
      components: body.components || defaultPageConfig.components,
      sectionConfigs: body.sectionConfigs || defaultPageConfig.sectionConfigs,
      siteSettings: {
        ...defaultPageConfig.siteSettings,
        locale: body.locale || defaultPageConfig.siteSettings?.locale,
        showLanguageSwitcher: true,
        theme: {
          ...defaultPageConfig.siteSettings?.theme,
          colors: {
            primary: body.primaryColor || defaultPageConfig.siteSettings?.theme?.colors?.primary,
            secondary: body.secondaryColor || defaultPageConfig.siteSettings?.theme?.colors?.secondary,
            accent: body.accentColor || defaultPageConfig.siteSettings?.theme?.colors?.accent,
            foreground: defaultPageConfig.siteSettings?.theme?.colors?.foreground || '#1f2937',
            background: defaultPageConfig.siteSettings?.theme?.colors?.background || '#ffffff',
            muted: defaultPageConfig.siteSettings?.theme?.colors?.muted || '#6b7280'
          },
          fonts: body.fontPairing || defaultPageConfig.siteSettings?.theme?.fonts
        }
      },
      version: '1.0',
      lastModified: new Date().toISOString()
    }

    // Also update wedding-level fields if provided
    const weddingUpdates: Record<string, any> = {
      has_website: true,
      updated_at: new Date().toISOString(),
    }
    if (body.primaryColor) weddingUpdates.primary_color = body.primaryColor
    if (body.secondaryColor) weddingUpdates.secondary_color = body.secondaryColor
    if (body.accentColor) weddingUpdates.accent_color = body.accentColor
    if (body.weddingTime) weddingUpdates.wedding_time = body.weddingTime
    if (body.receptionTime) weddingUpdates.reception_time = body.receptionTime
    if (body.venue1Name) weddingUpdates.ceremony_venue_name = body.venue1Name
    if (body.venue1Address) weddingUpdates.ceremony_venue_address = body.venue1Address
    if (body.venue2Name) weddingUpdates.reception_venue_name = body.venue2Name
    if (body.venue2Address) weddingUpdates.reception_venue_address = body.venue2Address

    // Insert website config
    const { error: insertError } = await supabase
      .from('wedding_websites')
      .insert({
        wedding_id: wedding.id,
        page_config: pageConfig,
        is_legacy: false,
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create website: ' + insertError.message }, { status: 500 })
    }

    // Update wedding flags
    await supabase
      .from('weddings')
      .update(weddingUpdates)
      .eq('id', wedding.id)

    // Also sync page_config to weddings table for backwards compat during transition
    await supabase
      .from('weddings')
      .update({ page_config: pageConfig })
      .eq('id', wedding.id)

    return NextResponse.json({
      success: true,
      weddingNameId: wedding.wedding_name_id,
      message: 'Website created successfully'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
