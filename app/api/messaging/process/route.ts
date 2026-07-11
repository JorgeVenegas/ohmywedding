import { NextRequest, NextResponse } from "next/server"
import { processWebhookEvent, resetStaleProcessingWebhookEvents } from "@/lib/messaging/process-webhook-event"
import { readQueueBatch, ackQueueMessage } from "@/lib/messaging/queue"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called three ways: instantly by the on_webhook_event_created DB trigger (pg_net,
// body = { webhook_event_id }), on a 1-minute safety-net sweep by pg_cron (empty
// body), and manually via curl for local verification — same code path either way.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.MESSAGING_PROCESS_SECRET
  if (!secret) return true // not configured yet (no Meta App / prod deploy yet) — allow
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let webhookEventId: string | undefined
  try {
    const body = await request.text()
    if (body) {
      webhookEventId = (JSON.parse(body) as { webhook_event_id?: string }).webhook_event_id
    }
  } catch {
    // Malformed body — fall through to sweep mode rather than fail outright.
  }

  try {
    if (webhookEventId) {
      await processWebhookEvent(webhookEventId)
      return NextResponse.json({ processed: 1 })
    }

    // Sweep mode: reclaim anything a crashed processor left stuck, then drain a
    // batch of whatever pgmq still has pending — the safety net for whatever the
    // instant push missed.
    await resetStaleProcessingWebhookEvents()
    const batch = await readQueueBatch(10, 30)
    let processed = 0
    for (const item of batch) {
      const id = item.message.webhook_event_id
      if (!id) {
        await ackQueueMessage(item.msg_id)
        continue
      }
      try {
        await processWebhookEvent(id)
        processed += 1
        await ackQueueMessage(item.msg_id)
      } catch (err) {
        console.error(`messaging sweep: failed to process webhook_event ${id}:`, err)
        // Leave it un-acked — pgmq's visibility timeout makes it reappear for retry.
      }
    }
    return NextResponse.json({ processed, swept: batch.length })
  } catch (error) {
    console.error("messaging process route failed:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
