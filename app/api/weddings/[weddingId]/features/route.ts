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

    // Get wedding features
    const { data: features, error: featuresError } = await supabase
      .from("wedding_features")
      .select("*")
      .eq("wedding_id", wedding.id)
      .single()

    if (featuresError && featuresError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw featuresError
    }

    // If no features exist, create default ones
    if (!features) {
      const { data: newFeatures, error: insertError } = await supabase
        .from("wedding_features")
        .insert({
          wedding_id: wedding.id,
          rsvp_enabled: true, // Default to true for existing weddings
          invitations_panel_enabled: true,
          gallery_enabled: true,
          registry_enabled: true,
          schedule_enabled: true,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return NextResponse.json({ features: newFeatures })
    }

    return NextResponse.json({ features })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch wedding features" },
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
      .from("wedding_features")
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

    return NextResponse.json({ features: data })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update wedding features" },
      { status: 500 }
    )
  }
}
