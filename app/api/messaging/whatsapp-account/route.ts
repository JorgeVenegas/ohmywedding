import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server"
import { isMessagingEnabledForWeddingNameId } from "@/lib/messaging/feature-flag"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Manual credential-entry form — the Embedded Signup stand-in until a real Meta
// App exists (design doc scope decision: no Embedded Signup JS SDK integration
// yet, see the approved plan). Same whatsapp_accounts row either way, so nothing
// here needs to change when Embedded Signup gets wired up later.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get("weddingId")
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    if (!isMessagingEnabledForWeddingNameId(decodeURIComponent(weddingId))) {
      return NextResponse.json({ error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: wedding } = await supabase
      .from("weddings")
      .select("id")
      .eq("wedding_name_id", decodeURIComponent(weddingId))
      .single()
    if (!wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data: account } = await supabase
      .from("whatsapp_accounts")
      .select("id, waba_id, phone_number_id, display_phone_number, display_name, status, connected_at")
      .eq("wedding_id", wedding.id)
      .maybeSingle()

    return NextResponse.json({ account: account ?? null })
  } catch (error) {
    console.error("GET /api/messaging/whatsapp-account failed:", error)
    return NextResponse.json({ error: "Failed to load account" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { weddingId, wabaId, phoneNumberId, displayPhoneNumber, displayName, accessTokenSecret } =
      (await request.json()) as {
        weddingId?: string
        wabaId?: string
        phoneNumberId?: string
        displayPhoneNumber?: string
        displayName?: string
        accessTokenSecret?: string
      }

    if (!weddingId || !wabaId || !phoneNumberId || !displayPhoneNumber) {
      return NextResponse.json(
        { error: "weddingId, wabaId, phoneNumberId, and displayPhoneNumber are required" },
        { status: 400 }
      )
    }
    if (!isMessagingEnabledForWeddingNameId(decodeURIComponent(weddingId))) {
      return NextResponse.json({ error: "Messaging is not enabled for this wedding" }, { status: 403 })
    }

    const userClient = await createServerSupabaseClient()
    const { data: wedding } = await userClient
      .from("weddings")
      .select("id")
      .eq("wedding_name_id", decodeURIComponent(weddingId))
      .single()
    if (!wedding) {
      return NextResponse.json({ error: "Not authorized for this wedding" }, { status: 403 })
    }

    const admin = createAdminSupabaseClient()
    const { data: channel } = await admin.from("channels").select("id").eq("type", "whatsapp").single()
    if (!channel) {
      return NextResponse.json({ error: "whatsapp channel not found" }, { status: 500 })
    }

    const { data: account, error } = await admin
      .from("whatsapp_accounts")
      .upsert(
        {
          wedding_id: wedding.id,
          channel_id: channel.id,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          display_phone_number: displayPhoneNumber,
          display_name: displayName ?? null,
          access_token_secret: accessTokenSecret || null,
          status: accessTokenSecret ? "connected" : "pending",
          connected_at: accessTokenSecret ? new Date().toISOString() : null,
        },
        { onConflict: "wedding_id,channel_id,phone_number_id" }
      )
      .select("id, waba_id, phone_number_id, display_phone_number, display_name, status, connected_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ account })
  } catch (error) {
    console.error("POST /api/messaging/whatsapp-account failed:", error)
    return NextResponse.json({ error: "Failed to save account" }, { status: 500 })
  }
}
