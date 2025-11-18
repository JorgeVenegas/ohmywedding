import { createServerSupabaseClient } from "@/lib/supabase-server"
import { generateWeddingIds } from "@/lib/wedding-id-generator"
import { createDefaultPageConfig } from "@/lib/page-config"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user (optional for now)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // For now, we'll allow wedding creation without authentication
    // In the future, you can uncomment the lines below to require authentication
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const body = await request.json()

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
      components: body.components || defaultPageConfig.components
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
      primary_color: body.primaryColor,
      secondary_color: body.secondaryColor,
      accent_color: body.accentColor,
      ceremony_venue_name: body.venue1Name,
      ceremony_venue_address: body.venue1Address,
      reception_venue_name: body.venue2Name,
      reception_venue_address: body.venue2Address,
      page_config: pageConfig,
      owner_id: user?.id || null, // Explicitly set to null if no user
    }

    const { data, error } = await supabase.from("weddings").insert([weddingData])

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ dateId, weddingNameId, data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
