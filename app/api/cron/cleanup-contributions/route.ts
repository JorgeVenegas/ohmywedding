import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Cron job: Clean up stale abandoned contributions
 * Runs daily at midnight (configured in vercel.json)
 * 
 * Marks contributions as "incomplete" based on their payment status and age:
 * - "pending" (checkout created but user never clicked pay) → incomplete after 2 days
 * - "requires_action" (user clicked pay but never completed bank transfer) → incomplete after 7 days
 * 
 * Completed contributions are ignored (user actually paid)
 * No refunds needed since these are unpaid contributions
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Cron: Unauthorized cleanup attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calculate cutoff dates
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const twoDaysAgoISO = twoDaysAgo.toISOString()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoISO = sevenDaysAgo.toISOString()

    console.log(
      `Cron: Cleaning up stale contributions (pending > 2 days, requires_action > 7 days)`
    )

    // Fetch stale contributions
    const { data: stalePending, error: fetchPendingError } = await supabase
      .from("registry_contributions")
      .select("id")
      .eq("payment_status", "pending")
      .lt("created_at", twoDaysAgoISO)

    if (fetchPendingError) {
      console.error("Cron: Error fetching stale pending contributions:", fetchPendingError)
      return NextResponse.json(
        { error: "Failed to fetch pending contributions", details: fetchPendingError.message },
        { status: 500 }
      )
    }

    const { data: staleRequiresAction, error: fetchRequiresActionError } = await supabase
      .from("registry_contributions")
      .select("id")
      .eq("payment_status", "requires_action")
      .lt("created_at", sevenDaysAgoISO)

    if (fetchRequiresActionError) {
      console.error(
        "Cron: Error fetching stale requires_action contributions:",
        fetchRequiresActionError
      )
      return NextResponse.json(
        {
          error: "Failed to fetch requires_action contributions",
          details: fetchRequiresActionError.message,
        },
        { status: 500 }
      )
    }

    const cleanupResults = {
      markedIncompleteCount: 0,
      failedUpdates: [] as Array<{ status: string; error: string }>,
    }

    // Mark stale pending contributions (2+ days) as incomplete
    const { data: updatedPending, error: updatePendingError } = await supabase
      .from("registry_contributions")
      .update({ payment_status: "incomplete" })
      .eq("payment_status", "pending")
      .lt("created_at", twoDaysAgoISO)
      .select("id")

    if (updatePendingError) {
      console.error("Cron: Error marking pending contributions as incomplete:", updatePendingError)
      return NextResponse.json(
        {
          error: "Failed to mark pending contributions",
          details: updatePendingError.message,
        },
        { status: 500 }
      )
    }

    // Mark stale requires_action contributions (7+ days) as incomplete
    const { data: updatedRequiresAction, error: updateRequiresActionError } = await supabase
      .from("registry_contributions")
      .update({ payment_status: "incomplete" })
      .eq("payment_status", "requires_action")
      .lt("created_at", sevenDaysAgoISO)
      .select("id")

    if (updateRequiresActionError) {
      console.error(
        "Cron: Error marking requires_action contributions as incomplete:",
        updateRequiresActionError
      )
      return NextResponse.json(
        {
          error: "Failed to mark requires_action contributions",
          details: updateRequiresActionError.message,
        },
        { status: 500 }
      )
    }

    cleanupResults.markedIncompleteCount =
      (updatedPending?.length || 0) + (updatedRequiresAction?.length || 0)

    console.log(
      `Cron: Cleaned up ${cleanupResults.markedIncompleteCount} stale contribution(s)`
    )

    return NextResponse.json({
      success: true,
      ...cleanupResults,
      summary: {
        pendingMarkedIncomplete: updatedPending?.length || 0,
        requiresActionMarkedIncomplete: updatedRequiresAction?.length || 0,
      },
    })
  } catch (error) {
    console.error("Cron: Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
