import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const decodedWeddingId = decodeURIComponent(weddingId)
    const supabase = await createServerSupabaseClient()

    // First, get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id")
      .eq("wedding_name_id", decodedWeddingId)
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
      // PGRST116 = no rows returned
      throw settingsError
    }

    // If no settings exist, create default ones
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from("wedding_settings")
        .insert({
          wedding_id: wedding.id,
          rsvp_travel_confirmation_enabled: true,
          rsvp_require_ticket_attachment: false,
          rsvp_require_no_ticket_reason: false,
          rsvp_allow_plus_ones: true,
          gallery_allow_guest_uploads: false,
          gallery_moderation_enabled: true,
          timezone: "UTC",
          language: "en",
        })
        .select()
        .single()

      if (insertError) throw insertError

      return NextResponse.json({ settings: newSettings })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch wedding settings" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const decodedWeddingId = decodeURIComponent(weddingId)
    const body = await request.json()
    const supabase = await createServerSupabaseClient()

    // First, get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id")
      .eq("wedding_name_id", decodedWeddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("wedding_settings")
      .upsert(
        {
          wedding_id: wedding.id,
          ...body,
        },
        {
          onConflict: "wedding_id",
        }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ settings: data })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update wedding settings" },
      { status: 500 }
    )
  }
}
