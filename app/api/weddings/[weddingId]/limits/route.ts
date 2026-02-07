import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getWeddingFeatureLimit } from "@/lib/subscription"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const decodedWeddingId = decodeURIComponent(weddingId)
    const supabase = await createServerSupabaseClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if it's a UUID or wedding_name_id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedWeddingId)
    
    // Verify user owns the wedding (check if they're owner or collaborator)
    let query = supabase
      .from("weddings")
      .select("id, wedding_name_id")
    
    if (isUuid) {
      query = query.eq("id", decodedWeddingId)
    } else {
      query = query.eq("wedding_name_id", decodedWeddingId)
    }
    
    const { data: wedding, error: weddingError } = await query.single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Fetch limits from plan_features
    const [guestLimit, groupLimit] = await Promise.all([
      getWeddingFeatureLimit(wedding.id, 'guests_limit'),
      getWeddingFeatureLimit(wedding.id, 'guest_groups_limit'),
    ])

    return NextResponse.json({
      guestLimit,
      groupLimit,
    })
  } catch (error) {
    console.error("Error fetching wedding limits:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
