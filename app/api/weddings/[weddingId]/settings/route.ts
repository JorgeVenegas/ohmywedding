import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const decodedWeddingId = decodeURIComponent(weddingId)
    const supabase = await createServerSupabaseClient()

    // Authenticate
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminSupabaseClient()

    // First, get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await adminClient
      .from("weddings")
      .select("id, owner_id, collaborator_emails")
      .eq("wedding_name_id", decodedWeddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Authorize: owner, superuser, or collaborator
    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() || '') || false

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

    if (!isOwner && !isCollaborator && !isSuperuser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get wedding settings
    const { data: settings, error: settingsError } = await adminClient
      .from("wedding_settings")
      .select("*")
      .eq("wedding_id", wedding.id)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("[settings GET] Error fetching settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch wedding settings" }, { status: 500 })
    }

    // If no settings exist, create default ones
    if (!settings) {
      const { data: newSettings, error: insertError } = await adminClient
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

      if (insertError) {
        console.error("[settings GET] Error creating default settings:", insertError)
        return NextResponse.json({ error: "Failed to create wedding settings" }, { status: 500 })
      }

      return NextResponse.json({ settings: newSettings })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[settings GET] Unexpected error:", error)
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

    // Authenticate
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminSupabaseClient()

    // First, get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await adminClient
      .from("weddings")
      .select("id, owner_id, collaborator_emails")
      .eq("wedding_name_id", decodedWeddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Authorize: only owner or superuser can update settings
    const isOwner = wedding.owner_id === user.id

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

    if (!isOwner && !isSuperuser) {
      return NextResponse.json({ error: "Forbidden - only the owner can update settings" }, { status: 403 })
    }

    // Sanitize: strip any fields that shouldn't be user-settable
    const { id, wedding_id, created_at, ...safeBody } = body

    const { data, error } = await adminClient
      .from("wedding_settings")
      .upsert(
        {
          wedding_id: wedding.id,
          ...safeBody,
        },
        {
          onConflict: "wedding_id",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("[settings PUT] Error updating settings:", error)
      return NextResponse.json({ error: "Failed to update wedding settings" }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error("[settings PUT] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to update wedding settings" },
      { status: 500 }
    )
  }
}
