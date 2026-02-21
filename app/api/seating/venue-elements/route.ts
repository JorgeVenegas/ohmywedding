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

// POST: Create a venue element
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
    const { element_type, element_shape, label, capacity, position_x, position_y, width, height, rotation } = body

    if (!element_type) {
      return NextResponse.json({ error: "element_type is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('venue_elements')
      .insert({
        wedding_id: weddingUuid,
        element_type,
        element_shape: element_shape ?? 'rect',
        label: label || null,
        capacity: capacity ?? 4,
        position_x: position_x ?? 200,
        position_y: position_y ?? 200,
        width: width ?? 150,
        height: height ?? 150,
        rotation: rotation ?? 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Update a venue element
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "element id is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('venue_elements')
      .update(updateData)
      .eq('id', id)
      .eq('wedding_id', weddingUuid)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete a venue element
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const elementId = searchParams.get('elementId')

    if (!weddingId || !elementId) {
      return NextResponse.json({ error: "weddingId and elementId are required" }, { status: 400 })
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
      .from('venue_elements')
      .delete()
      .eq('id', elementId)
      .eq('wedding_id', weddingUuid)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
