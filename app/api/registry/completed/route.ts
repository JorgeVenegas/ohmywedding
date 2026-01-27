import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get("weddingId")
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id")
      .eq("wedding_name_id", weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("registry_contributions")
      .select(
        "id, amount, contributor_name, message, created_at, custom_registry_item_id, custom_registry_items (title)"
      )
      .eq("wedding_id", wedding.id)
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false })
      .limit(Number.isFinite(limit) && limit > 0 ? limit : 5)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const contributions = (data || []).map((row) => ({
      id: row.id,
      amount: Number(row.amount || 0),
      contributorName: row.contributor_name || "Anonymous",
      message: row.message || "",
      itemTitle: (row.custom_registry_items as any)?.title || "",
      createdAt: row.created_at,
    }))

    return NextResponse.json({ contributions })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
