import { NextResponse } from "next/server"
import { isMessagingEnabledForWeddingNameId } from "@/lib/messaging/feature-flag"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/messaging/feature-flag?weddingId=<wedding_name_id> — lets client
// components (dashboard card, inbox page) decide whether to show messaging UI
// at all, without the MESSAGING_ENABLED_WEDDING_IDS allowlist ever shipping in
// the client bundle. Every actual messaging API route enforces this
// server-side too — this endpoint is UX, not the security boundary.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weddingId = searchParams.get("weddingId")
  if (!weddingId) {
    return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
  }
  return NextResponse.json({ enabled: isMessagingEnabledForWeddingNameId(decodeURIComponent(weddingId)) })
}
