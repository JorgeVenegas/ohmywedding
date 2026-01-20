import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingNameId = searchParams.get("weddingNameId")

    if (!weddingNameId) {
      return NextResponse.json(
        { error: "weddingNameId is required" },
        { status: 400 }
      )
    }

    const decodedWeddingNameId = decodeURIComponent(weddingNameId)
    const supabase = await createServerSupabaseClient()

    // First, get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id")
      .eq("wedding_name_id", decodedWeddingNameId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Get wedding settings
    const { data: settings, error: settingsError } = await supabase
      .from("wedding_settings")
      .select("*")
      .eq("wedding_id", wedding.id)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is OK - we'll return defaults
      console.error("Error fetching settings:", settingsError)
    }

    // If no settings exist, return defaults
    const defaultSettings = {
      rsvp_travel_confirmation_enabled: true,
      rsvp_require_ticket_attachment: false,
      rsvp_require_no_ticket_reason: false,
      rsvp_allow_plus_ones: true,
      gallery_allow_guest_uploads: false,
      gallery_moderation_enabled: true,
      timezone: "UTC",
      language: "en",
    }

    return NextResponse.json({
      settings: settings || defaultSettings,
    })
  } catch (error) {
    console.error("Error fetching public settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}
