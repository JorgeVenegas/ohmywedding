import { createServerSupabaseClient } from "@/lib/supabase-server"
import { generateWeddingIds } from "@/lib/wedding-id-generator"
import { createDefaultPageConfig } from "@/lib/page-config"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Handle GET requests - return user's weddings
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ weddings: [] })
    }
    
    // Get weddings owned by the user
    const { data: ownedWeddings, error: ownedError } = await supabase
      .from('weddings')
      .select('id, wedding_name_id, partner1_first_name, partner2_first_name, wedding_date')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    
    if (ownedError) {
      return NextResponse.json({ weddings: [] })
    }
    
    // Try to get weddings where user is a collaborator
    let collaboratorWeddings: typeof ownedWeddings = []
    if (user.email) {
      try {
        const { data } = await supabase
          .from('weddings')
          .select('id, wedding_name_id, partner1_first_name, partner2_first_name, wedding_date')
          .contains('collaborator_emails', [user.email.toLowerCase()])
          .order('created_at', { ascending: false })
        
        if (data) {
          collaboratorWeddings = data
        }
      } catch {
        // Column might not exist yet
      }
    }
    
    // Combine and deduplicate
    const allWeddings = [...(ownedWeddings || [])]
    for (const collab of collaboratorWeddings || []) {
      if (!allWeddings.find(w => w.id === collab.id)) {
        allWeddings.push(collab)
      }
    }
    
    // Enrich weddings with plan info from wedding_features
    const weddingIds = allWeddings.map(w => w.id)
    let planMap: Record<string, string> = {}
    if (weddingIds.length > 0) {
      const { data: features } = await supabase
        .from('wedding_features')
        .select('wedding_id, plan')
        .in('wedding_id', weddingIds)
      
      if (features) {
        planMap = Object.fromEntries(features.map(f => [f.wedding_id, f.plan || 'free']))
      }
    }
    
    const weddingsWithPlan = allWeddings.map(w => ({
      ...w,
      plan: planMap[w.id] || 'free',
    }))
    
    return NextResponse.json({ weddings: weddingsWithPlan })
  } catch (error) {
    return NextResponse.json({ weddings: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user - required for wedding creation
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Require authentication to create a wedding
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - please log in to create a wedding" }, { status: 401 })
    }

    // Safely parse the request body
    let body
    try {
      const text = await request.text()
      if (!text) {
        return NextResponse.json({ error: "Request body is empty" }, { status: 400 })
      }
      body = JSON.parse(text)
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate required fields
    if (!body.partner1FirstName || !body.partner2FirstName) {
      return NextResponse.json({ error: "Partner names are required" }, { status: 400 })
    }

    // Generate wedding IDs
    const { dateId, weddingNameId } = await generateWeddingIds(
      body.partner1FirstName,
      body.partner2FirstName,
      body.partner1LastName,
      body.partner2LastName,
      body.weddingDate, // Pass the date string directly to avoid timezone issues
    )

    // Create page configuration from user selections
    const defaultPageConfig = createDefaultPageConfig()
    
    // Use components from the form if provided, otherwise use defaults
    const pageConfig = {
      ...defaultPageConfig,
      components: body.components || defaultPageConfig.components,
      // Include sectionConfigs from the form - this contains variant settings, content, etc.
      sectionConfigs: body.sectionConfigs || defaultPageConfig.sectionConfigs,
      siteSettings: {
        ...defaultPageConfig.siteSettings,
        locale: body.locale || defaultPageConfig.siteSettings?.locale,
        showLanguageSwitcher: true,
        theme: {
          ...defaultPageConfig.siteSettings?.theme,
          colors: {
            primary: body.primaryColor,
            secondary: body.secondaryColor,
            accent: body.accentColor,
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

    // Create wedding record
    const weddingData = {
      date_id: dateId,
      wedding_name_id: weddingNameId,
      partner1_first_name: body.partner1FirstName,
      partner1_last_name: body.partner1LastName || null,
      partner2_first_name: body.partner2FirstName,
      partner2_last_name: body.partner2LastName || null,
      wedding_date: body.weddingDate || null,
      wedding_time: body.weddingTime || null,
      reception_time: body.receptionTime || null,
      primary_color: body.primaryColor,
      secondary_color: body.secondaryColor,
      accent_color: body.accentColor,
      ceremony_venue_name: body.venue1Name,
      ceremony_venue_address: body.venue1Address,
      reception_venue_name: body.venue2Name,
      reception_venue_address: body.venue2Address,
      page_config: pageConfig,
      owner_id: user.id, // Set to authenticated user's ID
    }

    const { data, error } = await supabase.from("weddings").insert([weddingData])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ dateId, weddingNameId, data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
