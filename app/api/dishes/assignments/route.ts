import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

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

// GET: Fetch all dish assignments for a wedding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('guest_dish_assignments')
      .select('*, guests(id, name), dishes(id, name, category)')
      .eq('wedding_id', weddingUuid)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ assignments: data || [] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Assign dish to guest(s) — supports bulk assignment by group or table
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const body = await request.json()
    const { dish_id, guest_ids, group_id, table_id } = body

    if (!dish_id) {
      return NextResponse.json({ error: "dish_id is required" }, { status: 400 })
    }

    let targetGuestIds: string[] = guest_ids || []

    // If group_id provided, get all guests in that group
    if (group_id) {
      const { data: groupGuests } = await supabase
        .from('guests')
        .select('id')
        .eq('wedding_id', weddingUuid)
        .eq('guest_group_id', group_id)
      if (groupGuests) {
        targetGuestIds = [...targetGuestIds, ...groupGuests.map(g => g.id)]
      }
    }

    // If table_id provided, get all guests assigned to that table
    if (table_id) {
      const { data: tableAssignments } = await supabase
        .from('seating_assignments')
        .select('guest_id')
        .eq('wedding_id', weddingUuid)
        .eq('table_id', table_id)
      if (tableAssignments) {
        targetGuestIds = [...targetGuestIds, ...tableAssignments.map(a => a.guest_id)]
      }
    }

    // Deduplicate
    targetGuestIds = [...new Set(targetGuestIds)]

    if (targetGuestIds.length === 0) {
      return NextResponse.json({ error: "No guests to assign" }, { status: 400 })
    }

    // Upsert assignments (on conflict update the dish)
    const rows = targetGuestIds.map(guest_id => ({
      wedding_id: weddingUuid,
      guest_id,
      dish_id,
    }))

    const { data, error } = await supabase
      .from('guest_dish_assignments')
      .upsert(rows, { onConflict: 'wedding_id,guest_id' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ data, count: targetGuestIds.length })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Remove dish assignment for a guest
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const guestId = searchParams.get('guestId')
    if (!weddingId || !guestId) {
      return NextResponse.json({ error: "weddingId and guestId are required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const weddingUuid = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!weddingUuid) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from('guest_dish_assignments')
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
