import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { requireFeature } from "@/lib/subscription-api"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Resolve wedding_name_id to wedding UUID
async function resolveWeddingId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, weddingNameId: string) {
  const { data, error } = await supabase
    .from('weddings')
    .select('id')
    .eq('wedding_name_id', weddingNameId)
    .single()
  if (error || !data) return null
  return data.id as string
}

// GET: Fetch all seating tables, assignments, and venue elements for a wedding
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

    // Fetch tables with their assignments (including guest names)
    const [tablesResult, assignmentsResult, elementsResult] = await Promise.all([
      supabase
        .from('seating_tables')
        .select('*')
        .eq('wedding_id', weddingUuid)
        .order('display_order', { ascending: true }),
      supabase
        .from('seating_assignments')
        .select('*, guests(id, name, confirmation_status, tags)')
        .eq('wedding_id', weddingUuid),
      supabase
        .from('venue_elements')
        .select('*')
        .eq('wedding_id', weddingUuid),
    ])

    if (tablesResult.error) {
      return NextResponse.json({ error: tablesResult.error.message }, { status: 400 })
    }

    return NextResponse.json({
      tables: tablesResult.data || [],
      assignments: assignmentsResult.data || [],
      venueElements: elementsResult.data || [],
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create a new seating table
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
    const { name, shape, capacity, side_a_count, side_b_count, head_a_count, head_b_count, position_x, position_y, rotation, width, height, display_order } = body

    const { data, error } = await supabase
      .from('seating_tables')
      .insert({
        wedding_id: weddingUuid,
        name: name || 'Table',
        shape: shape || 'round',
        capacity: capacity || 8,
        side_a_count: side_a_count ?? null,
        side_b_count: side_b_count ?? null,
        head_a_count: head_a_count ?? null,
        head_b_count: head_b_count ?? null,
        position_x: position_x ?? 100,
        position_y: position_y ?? 100,
        rotation: rotation ?? 0,
        width: width ?? 120,
        height: height ?? 120,
        display_order: display_order ?? 0,
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

// PUT: Full save — create new items, update existing, delete removed, sync assignments
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
    const { tables = [], venueElements = [], assignments, deletedTableIds = [], deletedElementIds = [] } = body

    const tableIdMap: Record<string, string> = {}
    const elementIdMap: Record<string, string> = {}

    const isTemp = (id: string) => typeof id === 'string' && id.startsWith('temp_')

    const tempTables = tables.filter((t: { id: string }) => isTemp(t.id))
    const existingTables = tables.filter((t: { id: string }) => !isTemp(t.id))
    const tempElements = venueElements.filter((e: { id: string }) => isTemp(e.id))
    const existingElements = venueElements.filter((e: { id: string }) => !isTemp(e.id))

    const toTableRow = (t: typeof tables[number]) => ({
      name: t.name,
      shape: t.shape,
      capacity: t.capacity,
      side_a_count: t.side_a_count ?? null,
      side_b_count: t.side_b_count ?? null,
      head_a_count: t.head_a_count ?? null,
      head_b_count: t.head_b_count ?? null,
      position_x: t.position_x,
      position_y: t.position_y,
      rotation: t.rotation,
      width: t.width,
      height: t.height,
      display_order: t.display_order,
    })

    const toElementRow = (e: typeof venueElements[number]) => ({
      element_type: e.element_type,
      element_shape: e.element_shape ?? 'rect',
      label: e.label,
      position_x: e.position_x,
      position_y: e.position_y,
      width: e.width,
      height: e.height,
      rotation: e.rotation,
      color: e.color ?? null,
    })

    // Step 1: deletes + upsert existing — all in parallel
    await Promise.all([
      deletedTableIds.length > 0
        ? supabase.from('seating_tables').delete().in('id', deletedTableIds).eq('wedding_id', weddingUuid)
        : Promise.resolve(),
      deletedElementIds.length > 0
        ? supabase.from('venue_elements').delete().in('id', deletedElementIds).eq('wedding_id', weddingUuid)
        : Promise.resolve(),
      existingTables.length > 0
        ? supabase.from('seating_tables').upsert(
            existingTables.map((t: typeof tables[number]) => ({ id: t.id, wedding_id: weddingUuid, ...toTableRow(t) })),
            { onConflict: 'id' }
          )
        : Promise.resolve(),
      existingElements.length > 0
        ? supabase.from('venue_elements').upsert(
            existingElements.map((e: typeof venueElements[number]) => ({ id: e.id, wedding_id: weddingUuid, ...toElementRow(e) })),
            { onConflict: 'id' }
          )
        : Promise.resolve(),
    ])

    // Step 2: batch insert new (temp) items — in parallel, need returned IDs
    const [tempTablesResult, tempElementsResult] = await Promise.all([
      tempTables.length > 0
        ? supabase.from('seating_tables')
            .insert(tempTables.map((t: typeof tables[number]) => ({ wedding_id: weddingUuid, ...toTableRow(t) })))
            .select('id')
        : Promise.resolve({ data: [] as { id: string }[] | null }),
      tempElements.length > 0
        ? supabase.from('venue_elements')
            .insert(tempElements.map((e: typeof venueElements[number]) => ({ wedding_id: weddingUuid, ...toElementRow(e) })))
            .select('id')
        : Promise.resolve({ data: [] as { id: string }[] | null }),
    ])

    // Map temp IDs → real DB IDs (insert preserves order)
    tempTablesResult.data?.forEach((row: { id: string }, i: number) => {
      tableIdMap[tempTables[i].id] = row.id
    })
    tempElementsResult.data?.forEach((row: { id: string }, i: number) => {
      elementIdMap[tempElements[i].id] = row.id
    })

    // Step 3: Bulk sync assignments (only if provided)
    if (Array.isArray(assignments)) {
      // Delete all existing assignments for this wedding
      await supabase
        .from('seating_assignments')
        .delete()
        .eq('wedding_id', weddingUuid)

      // Insert current assignments (resolving temp IDs)
      if (assignments.length > 0) {
        const rows = assignments.map((a: { table_id: string; guest_id: string }) => ({
          wedding_id: weddingUuid,
          table_id: tableIdMap[a.table_id] ?? a.table_id,
          guest_id: a.guest_id,
        }))
        await supabase.from('seating_assignments').insert(rows)
      }
    }

    return NextResponse.json({ idMaps: { tables: tableIdMap, elements: elementIdMap } })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


// DELETE: Delete a seating table by id
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const tableId = searchParams.get('tableId')

    if (!weddingId || !tableId) {
      return NextResponse.json({ error: "weddingId and tableId are required" }, { status: 400 })
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
      .from('seating_tables')
      .delete()
      .eq('id', tableId)
      .eq('wedding_id', weddingUuid)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
