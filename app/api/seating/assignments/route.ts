import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { requireFeature } from "@/lib/subscription-api"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function resolveWeddingId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, weddingNameId: string) {
  const { data, error } = await supabase
    .from('weddings')
    .select('id')
    .eq('wedding_name_id', weddingNameId)
    .single()
  if (error || !data) return null
  return data.id as string
}

// POST: Assign a guest to a table
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const decodedWeddingId = decodeURIComponent(weddingId)
    const featureCheck = await requireFeature('seating_enabled', decodedWeddingId)
    if (!featureCheck.allowed) return featureCheck.response!

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodedWeddingId)
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const body = await request.json()
    const { table_id, guest_id, seat_number } = body

    if (!table_id || !guest_id) {
      return NextResponse.json({ error: "table_id and guest_id are required" }, { status: 400 })
    }

    // Upsert: if guest already assigned, move them
    const { data, error } = await supabase
      .from('seating_assignments')
      .upsert(
        {
          wedding_id: weddingUuid,
          table_id,
          guest_id,
          seat_number: seat_number || null,
        },
        { onConflict: 'wedding_id,guest_id' }
      )
      .select('*, guests(id, name, confirmation_status, tags)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Move a guest to a different table
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const decodedWeddingId = decodeURIComponent(weddingId)
    const featureCheck = await requireFeature('seating_enabled', decodedWeddingId)
    if (!featureCheck.allowed) return featureCheck.response!

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodedWeddingId)
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const body = await request.json()
    const { guest_id, new_table_id, seat_number } = body

    if (!guest_id || !new_table_id) {
      return NextResponse.json({ error: "guest_id and new_table_id are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('seating_assignments')
      .update({ table_id: new_table_id, seat_number: seat_number || null })
      .eq('wedding_id', weddingUuid)
      .eq('guest_id', guest_id)
      .select('*, guests(id, name, confirmation_status, tags)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Remove guest from table
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const guestId = searchParams.get('guestId')

    if (!weddingId || !guestId) {
      return NextResponse.json({ error: "weddingId and guestId are required" }, { status: 400 })
    }

    const decodedWeddingId = decodeURIComponent(weddingId)
    const featureCheck = await requireFeature('seating_enabled', decodedWeddingId)
    if (!featureCheck.allowed) return featureCheck.response!

    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodedWeddingId)
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from('seating_assignments')
      .delete()
      .eq('wedding_id', weddingUuid)
      .eq('guest_id', guestId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
