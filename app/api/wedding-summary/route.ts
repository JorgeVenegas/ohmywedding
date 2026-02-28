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

// UUID pattern
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET: Fetch complete wedding summary data for export
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }
    const supabase = await createServerSupabaseClient()
    const decodedId = decodeURIComponent(weddingId)

    // Accept either a UUID (from the admin panel) or a wedding_name_id slug
    let weddingUuid: string
    if (UUID_RE.test(decodedId)) {
      weddingUuid = decodedId
    } else {
      const resolved = await resolveWeddingId(supabase, decodedId)
      if (!resolved) {
        return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
      }
      weddingUuid = resolved
    }

    // Fetch all data in parallel
    const [
      weddingResult,
      guestsResult,
      groupsResult,
      tablesResult,
      assignmentsResult,
      elementsResult,
      dishesResult,
      dishAssignmentsResult,
      itineraryResult,
    ] = await Promise.all([
      supabase.from('weddings').select('id, wedding_name_id, partner1_first_name, partner1_last_name, partner2_first_name, partner2_last_name, wedding_date, wedding_time, reception_time, ceremony_venue_name, ceremony_venue_address, reception_venue_name, reception_venue_address').eq('id', weddingUuid).single(),
      supabase.from('guests').select('id, name, guest_group_id, confirmation_status, dietary_restrictions, notes').eq('wedding_id', weddingUuid),
      supabase.from('guest_groups').select('id, name').eq('wedding_id', weddingUuid),
      supabase.from('seating_tables').select('*').eq('wedding_id', weddingUuid).order('display_order', { ascending: true }),
      supabase.from('seating_assignments').select('*').eq('wedding_id', weddingUuid),
      supabase.from('venue_elements').select('*').eq('wedding_id', weddingUuid),
      supabase.from('dishes').select('*').eq('wedding_id', weddingUuid).order('display_order', { ascending: true }),
      supabase.from('guest_dish_assignments').select('*, dishes(id, name, category)').eq('wedding_id', weddingUuid),
      supabase.from('itinerary_events').select('*').eq('wedding_id', weddingUuid).order('start_time', { ascending: true }),
    ])

    const wedding = weddingResult.data
    if (!wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }
    const guests = guestsResult.data || []
    const groups = groupsResult.data || []
    const tables = tablesResult.data || []
    const seatAssignments = assignmentsResult.data || []
    const venueElements = elementsResult.data || []
    const dishes = dishesResult.data || []
    const dishAssignments = dishAssignmentsResult.data || []
    const itineraryEvents = itineraryResult.data || []

    // Build group lookup
    const groupMap = new Map(groups.map(g => [g.id, g.name]))

    // Build dish assignment lookup (guest_id -> dish info)
    const dishMap = new Map(dishAssignments.map(da => [da.guest_id, da.dishes]))

    // Build seating data: tables with their assigned guests
    const seatingData = tables.map((table, idx) => {
      const tableAssignments = seatAssignments.filter(a => a.table_id === table.id)
      const tableGuests = tableAssignments.map(a => {
        const guest = guests.find(g => g.id === a.guest_id)
        if (!guest) return null
        const dish = dishMap.get(guest.id)
        return {
          name: guest.name,
          groupName: guest.guest_group_id ? groupMap.get(guest.guest_group_id) || null : null,
          status: guest.confirmation_status,
          dietaryRestrictions: guest.dietary_restrictions,
          dish: dish ? { name: (dish as { name: string }).name, category: (dish as { category: string }).category } : null,
          seatNumber: a.seat_number,
        }
      }).filter(Boolean)

      return {
        tableNumber: idx + 1,
        tableName: table.name,
        shape: table.shape,
        capacity: table.capacity,
        occupancy: tableAssignments.length,
        position_x: table.position_x,
        position_y: table.position_y,
        width: table.width,
        height: table.height,
        rotation: table.rotation,
        guests: tableGuests,
      }
    })

    // Dish counts
    const dishCounts = dishes.map(dish => {
      const count = dishAssignments.filter(da => da.dish_id === dish.id).length
      return {
        id: dish.id,
        name: dish.name,
        category: dish.category,
        description: dish.description,
        is_vegetarian: dish.is_vegetarian,
        is_vegan: dish.is_vegan,
        is_gluten_free: dish.is_gluten_free,
        allergens: dish.allergens,
        count,
      }
    })

    // Build itinerary tree (parent events with children)
    const mainEvents = itineraryEvents.filter(e => !e.parent_id)
    const itineraryTree = mainEvents.map(event => ({
      ...event,
      children: itineraryEvents.filter(e => e.parent_id === event.id).sort((a, b) => a.display_order - b.display_order),
    }))

    // Guest stats
    const confirmed = guests.filter(g => g.confirmation_status === 'confirmed').length
    const declined = guests.filter(g => g.confirmation_status === 'declined').length
    const pending = guests.filter(g => g.confirmation_status === 'pending').length
    const assignedGuests = seatAssignments.length
    const unassignedGuests = confirmed - assignedGuests

    return NextResponse.json({
      wedding,
      stats: {
        totalGuests: guests.length,
        confirmed,
        declined,
        pending,
        totalTables: tables.length,
        assignedGuests,
        unassignedGuests,
        totalDishes: dishes.length,
        totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
      },
      seating: seatingData,
      venueElements,
      dishes: dishCounts,
      itinerary: itineraryTree,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
