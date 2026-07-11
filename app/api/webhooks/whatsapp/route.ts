import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase-server"
import { whatsappAdapter } from "@/lib/messaging/channels/whatsapp"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Meta's one-time subscription verification challenge (App dashboard -> Webhooks).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}

// No business logic here on purpose (design doc §4.3) — verify, persist raw,
// return 200. The on_webhook_event_created DB trigger takes it from there.
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-hub-signature-256")

    const verified = whatsappAdapter.verifyWebhookSignature(body, signature)
    if (!verified) {
      console.error("WhatsApp webhook: signature verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    let payload: unknown
    try {
      payload = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // One webhook_events row per HTTP delivery (a single call can batch several
    // messages/statuses — those get split out during processing). Meta retries
    // the exact same body on failure, so a hash of it is the natural dedupe key.
    const providerEventId = crypto.createHash("sha256").update(body).digest("hex")

    const supabase = createAdminSupabaseClient()
    const { error } = await supabase.from("webhook_events").insert({
      provider: "whatsapp",
      provider_event_id: providerEventId,
      signature_verified: true,
      raw_payload: payload,
      status: "pending",
    })

    if (error && error.code !== "23505") {
      // 23505 = unique_violation on (provider, provider_event_id) — an exact
      // redelivery of a payload we've already stored. Not an error condition;
      // Meta just wants a 200 either way.
      console.error("WhatsApp webhook: failed to persist webhook_events row:", error)
      return NextResponse.json({ error: "Failed to record webhook" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("WhatsApp webhook handler failed:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
