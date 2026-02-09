import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const decodedWeddingId = decodeURIComponent(weddingId)
    const supabase = await createServerSupabaseClient()

    // Support both UUID and wedding_name_id (slug)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedWeddingId)

    const weddingQuery = supabase
      .from("weddings")
      .select("id")

    const { data: wedding, error: weddingError } = isUUID
      ? await weddingQuery.eq("id", decodedWeddingId).single()
      : await weddingQuery.eq("wedding_name_id", decodedWeddingId).single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Get the wedding's subscription plan
    const { data: subscription } = await supabase
      .from("wedding_subscriptions")
      .select("plan")
      .eq("wedding_id", wedding.id)
      .maybeSingle()

    const plan = subscription?.plan || "free"

    // Get all features for this plan from plan_features table
    const { data: planFeatures, error: featuresError } = await supabase
      .from("plan_features")
      .select("feature_key, enabled, limit_value")
      .eq("plan", plan)

    if (featuresError) throw featuresError

    // Build features map
    const featuresMap: Record<string, { enabled: boolean; limit: number | null }> = {}
    for (const f of planFeatures || []) {
      featuresMap[f.feature_key] = { enabled: f.enabled, limit: f.limit_value }
    }

    return NextResponse.json({ plan, features: featuresMap })
  } catch (error) {
    console.error("Error fetching wedding features:", error)
    return NextResponse.json(
      { error: "Failed to fetch wedding features" },
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

    // Support both UUID and wedding_name_id (slug)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedWeddingId)

    const weddingQuery = supabase
      .from("weddings")
      .select("id")

    const { data: wedding, error: weddingError } = isUUID
      ? await weddingQuery.eq("id", decodedWeddingId).single()
      : await weddingQuery.eq("wedding_name_id", decodedWeddingId).single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // The PUT is for updating the subscription plan (admin use)
    const { plan } = body
    if (!plan || !['free', 'premium', 'deluxe'].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("wedding_subscriptions")
      .upsert(
        {
          wedding_id: wedding.id,
          plan,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "wedding_id" }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ subscription: data })
  } catch (error) {
    console.error("Error updating wedding features:", error)
    return NextResponse.json(
      { error: "Failed to update wedding features" },
      { status: 500 }
    )
  }
}
