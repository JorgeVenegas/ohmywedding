import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns the wedding
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, owner_id")
      .eq("id", weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    if (wedding.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get wedding subscription
    const { data: subscription, error: subError } = await supabase
      .from("wedding_subscriptions")
      .select("*")
      .eq("wedding_id", weddingId)
      .single()

    if (subError && subError.code !== "PGRST116") {
      throw subError
    }

    // If no subscription exists, create default free subscription
    if (!subscription) {
      const { data: newSub, error: insertError } = await supabase
        .from("wedding_subscriptions")
        .insert({
          wedding_id: weddingId,
          plan: 'free',
        })
        .select()
        .single()

      if (insertError) throw insertError
      return NextResponse.json({ subscription: newSub })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
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
    const body = await request.json()
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user owns the wedding
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .select("id, owner_id")
      .eq("id", weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    if (wedding.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update subscription
    const { data, error } = await supabase
      .from("wedding_subscriptions")
      .upsert(
        {
          wedding_id: weddingId,
          plan: body.plan,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "wedding_id",
        }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ subscription: data })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    )
  }
}
