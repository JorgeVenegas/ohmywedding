import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET all guests for a wedding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawWeddingNameId = searchParams.get('weddingNameId')
    const groupId = searchParams.get('groupId')
    const ungrouped = searchParams.get('ungrouped')

    if (!rawWeddingNameId) {
      return NextResponse.json({ error: "weddingNameId is required" }, { status: 400 })
    }

    // Decode the weddingNameId in case it's URL encoded
    const weddingNameId = decodeURIComponent(rawWeddingNameId)

    const supabase = await createServerSupabaseClient()
    
    let query = supabase
      .from("guests")
      .select("*")
      .eq("wedding_name_id", weddingNameId)
      .order("created_at", { ascending: true })

    if (groupId) {
      query = query.eq("guest_group_id", groupId)
    } else if (ungrouped === 'true') {
      query = query.is("guest_group_id", null)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new guest or bulk create guests
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    // Check if this is a bulk insert
    if (body.bulk && Array.isArray(body.guests)) {
      // Decode the weddingNameId in case it's URL encoded
      const weddingNameId = decodeURIComponent(body.weddingNameId)
      
      const guestsToInsert = body.guests.map((guest: {
        name: string
        phoneNumber?: string
        email?: string
        tags?: string[]
        confirmationStatus?: string
        dietaryRestrictions?: string
        notes?: string
        guestGroupId?: string
        invitedBy?: string[]
      }) => ({
        wedding_name_id: weddingNameId,
        guest_group_id: guest.guestGroupId || null,
        name: guest.name,
        phone_number: guest.phoneNumber || null,
        email: guest.email || null,
        tags: guest.tags || [],
        confirmation_status: guest.confirmationStatus || 'pending',
        dietary_restrictions: guest.dietaryRestrictions || null,
        notes: guest.notes || null,
        invited_by: guest.invitedBy || [],
      }))

      const { data, error } = await supabase
        .from("guests")
        .insert(guestsToInsert)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data, count: data.length })
    }

    // Single guest insert (original behavior)
    // Decode the weddingNameId in case it's URL encoded
    const weddingNameId = decodeURIComponent(body.weddingNameId)

    const { data, error } = await supabase.from("guests").insert([
      {
        wedding_name_id: weddingNameId,
        guest_group_id: body.guestGroupId || null,
        name: body.name,
        phone_number: body.phoneNumber || null,
        email: body.email || null,
        tags: body.tags || [],
        confirmation_status: body.confirmationStatus || 'pending',
        dietary_restrictions: body.dietaryRestrictions || null,
        notes: body.notes || null,
        invited_by: body.invitedBy || [],
      },
    ]).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update a guest
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("guests")
      .update({
        name: body.name,
        phone_number: body.phoneNumber,
        email: body.email,
        tags: body.tags || [],
        guest_group_id: body.guestGroupId,
        confirmation_status: body.confirmationStatus,
        dietary_restrictions: body.dietaryRestrictions,
        notes: body.notes,
        invited_by: body.invitedBy || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE a guest
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from("guests")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
