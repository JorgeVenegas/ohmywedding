import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function resolveWeddingId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, weddingNameId: string) {
  const { data, error } = await supabase
    .from('weddings')
    .select('id, wedding_date')
    .eq('wedding_name_id', weddingNameId)
    .single()
  if (error || !data) return null
  return { id: data.id as string, wedding_date: data.wedding_date as string | null }
}

// GET: Fetch all itinerary events for a wedding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const resolved = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!resolved) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }
    const { id: weddingUuid, wedding_date } = resolved

    const { data, error } = await supabase
      .from('itinerary_events')
      .select('*')
      .eq('wedding_id', weddingUuid)
      .order('start_time', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ events: data || [], wedding_date: wedding_date || null })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create a new itinerary event
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const resolved = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!resolved) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }
    const { id: weddingUuid } = resolved

    const body = await request.json()
    const { title, description, location, start_time, end_time, notes, icon, parent_id, display_order, subEvents } = body

    if (!title || !start_time) {
      return NextResponse.json({ error: "Title and start time are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('itinerary_events')
      .insert({
        wedding_id: weddingUuid,
        parent_id: parent_id || null,
        title,
        description: description || null,
        location: location || null,
        start_time,
        end_time: end_time || null,
        notes: notes || null,
        icon: icon || null,
        display_order: display_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Batch-create sub-events if provided
    if (Array.isArray(subEvents) && subEvents.length > 0) {
      await supabase.from('itinerary_events').insert(
        subEvents
          .filter((se: { title?: string; start_time?: string }) => se.title && se.start_time)
          .map((se: { title: string; start_time: string; icon?: string }, i: number) => ({
            wedding_id: weddingUuid,
            parent_id: data.id,
            title: se.title,
            start_time: se.start_time,
            icon: se.icon || null,
            display_order: i,
          }))
      )
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Update an itinerary event
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const eventId = searchParams.get('eventId')
    if (!weddingId || !eventId) {
      return NextResponse.json({ error: "weddingId and eventId are required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const resolved = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!resolved) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }
    const { id: weddingUuid } = resolved

    const body = await request.json()
    const { title, description, location, start_time, end_time, notes, icon, parent_id, display_order, subEvents } = body

    const { data, error } = await supabase
      .from('itinerary_events')
      .update({
        title,
        description,
        location,
        start_time,
        end_time,
        notes,
        icon,
        parent_id,
        display_order,
      })
      .eq('id', eventId)
      .eq('wedding_id', weddingUuid)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Replace sub-events if provided (delete all existing, then insert new)
    if (Array.isArray(subEvents)) {
      await supabase.from('itinerary_events').delete().eq('parent_id', eventId)
      if (subEvents.length > 0) {
        await supabase.from('itinerary_events').insert(
          subEvents
            .filter((se: { title?: string; start_time?: string }) => se.title && se.start_time)
            .map((se: { title: string; start_time: string; icon?: string }, i: number) => ({
              wedding_id: weddingUuid,
              parent_id: eventId,
              title: se.title,
              start_time: se.start_time,
              icon: se.icon || null,
              display_order: i,
            }))
        )
      }
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete an itinerary event
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const eventId = searchParams.get('eventId')
    if (!weddingId || !eventId) {
      return NextResponse.json({ error: "weddingId and eventId are required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const resolved = await resolveWeddingId(supabase, decodeURIComponent(weddingId))
    if (!resolved) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }
    const { id: weddingUuid } = resolved

    const { error } = await supabase
      .from('itinerary_events')
      .delete()
      .eq('id', eventId)
      .eq('wedding_id', weddingUuid)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
