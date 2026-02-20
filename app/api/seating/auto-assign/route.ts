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

// POST: Auto-assign unassigned confirmed guests to tables with available seats
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
    const keepGroupsTogether = body.keepGroupsTogether !== false // default true

    // Get all tables with current assignment counts
    const { data: tables } = await supabase
      .from('seating_tables')
      .select('id, capacity')
      .eq('wedding_id', weddingUuid)
      .order('display_order', { ascending: true })

    if (!tables || tables.length === 0) {
      return NextResponse.json({ error: "No tables available" }, { status: 400 })
    }

    // Get existing assignments to count per table
    const { data: existingAssignments } = await supabase
      .from('seating_assignments')
      .select('table_id, guest_id')
      .eq('wedding_id', weddingUuid)

    const assignedGuestIds = new Set((existingAssignments || []).map(a => a.guest_id))
    const tableOccupancy: Record<string, number> = {}
    for (const a of existingAssignments || []) {
      tableOccupancy[a.table_id] = (tableOccupancy[a.table_id] || 0) + 1
    }

    // Get unassigned confirmed guests
    const { data: guests } = await supabase
      .from('guests')
      .select('id, name, guest_group_id, confirmation_status')
      .eq('wedding_id', weddingUuid)
      .eq('confirmation_status', 'confirmed')
      .order('guest_group_id', { ascending: true })

    if (!guests) {
      return NextResponse.json({ error: "No guests found" }, { status: 400 })
    }

    const unassignedGuests = guests.filter(g => !assignedGuestIds.has(g.id))

    if (unassignedGuests.length === 0) {
      return NextResponse.json({ assigned: 0, message: "All confirmed guests are already assigned" })
    }

    // Group guests by their guest_group_id if keepGroupsTogether
    const guestsToAssign: Array<{ id: string; group_id: string | null }[]> = []

    if (keepGroupsTogether) {
      const groupMap = new Map<string, { id: string; group_id: string | null }[]>()
      const ungrouped: { id: string; group_id: string | null }[] = []

      for (const g of unassignedGuests) {
        if (g.guest_group_id) {
          const existing = groupMap.get(g.guest_group_id) || []
          existing.push({ id: g.id, group_id: g.guest_group_id })
          groupMap.set(g.guest_group_id, existing)
        } else {
          ungrouped.push({ id: g.id, group_id: null })
        }
      }

      // Add groups first, then individual ungrouped guests
      for (const group of groupMap.values()) {
        guestsToAssign.push(group)
      }
      for (const g of ungrouped) {
        guestsToAssign.push([g])
      }
    } else {
      for (const g of unassignedGuests) {
        guestsToAssign.push([{ id: g.id, group_id: g.guest_group_id }])
      }
    }

    // Assign groups/guests to tables
    const newAssignments: { wedding_id: string; table_id: string; guest_id: string }[] = []

    for (const guestBatch of guestsToAssign) {
      // Find a table with enough space for this batch
      let assigned = false
      for (const table of tables) {
        const currentOccupancy = tableOccupancy[table.id] || 0
        const availableSeats = table.capacity - currentOccupancy

        if (availableSeats >= guestBatch.length) {
          for (const guest of guestBatch) {
            newAssignments.push({
              wedding_id: weddingUuid,
              table_id: table.id,
              guest_id: guest.id,
            })
            tableOccupancy[table.id] = (tableOccupancy[table.id] || 0) + 1
          }
          assigned = true
          break
        }
      }

      // If no single table fits the whole group, split across tables
      if (!assigned) {
        for (const guest of guestBatch) {
          for (const table of tables) {
            const currentOccupancy = tableOccupancy[table.id] || 0
            if (currentOccupancy < table.capacity) {
              newAssignments.push({
                wedding_id: weddingUuid,
                table_id: table.id,
                guest_id: guest.id,
              })
              tableOccupancy[table.id] = (tableOccupancy[table.id] || 0) + 1
              break
            }
          }
        }
      }
    }

    // Insert all new assignments
    if (newAssignments.length > 0) {
      const { error } = await supabase
        .from('seating_assignments')
        .insert(newAssignments)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      assigned: newAssignments.length,
      message: `Successfully assigned ${newAssignments.length} guests to tables`,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
