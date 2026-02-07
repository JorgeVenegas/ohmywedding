import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getWeddingFeatureLimit } from "@/lib/subscription"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const { weddingNameId } = await params
    const supabase = await createServerSupabaseClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns the wedding (check if they're owner or collaborator)
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, wedding_name_id")
      .or(`id.eq.${weddingNameId},wedding_name_id.eq.${weddingNameId}`)
      .eq("user_id", user.id)
      .single()

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
