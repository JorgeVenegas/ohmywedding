import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET all guest groups for a wedding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const decodedWeddingId = decodeURIComponent(weddingId)

    const supabase = await createServerSupabaseClient()
    
    // First, get the wedding UUID from the wedding_name_id
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('wedding_name_id', decodedWeddingId)
      .single()
    
    if (weddingError || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }
    
    const { data, error } = await supabase
      .from("guest_groups")
      .select(`
        *,
        guests (*)
      `)
      .eq("wedding_id", wedding.id)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new guest group
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const weddingId = body.weddingId

    if (!weddingId) {
      return NextResponse.json({ error: "weddingId is required" }, { status: 400 })
    }

    const decodedWeddingId = decodeURIComponent(weddingId)

    // Debug: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Debug: Check the wedding ownership
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails')
      .eq('wedding_name_id', decodedWeddingId)
      .single()
    
    if (weddingError) {
      console.error('Wedding lookup error:', weddingError)
      return NextResponse.json({ error: `Wedding lookup failed: ${weddingError.message}` }, { status: 500 })
    }
    
    if (!wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const { data, error } = await supabase.from("guest_groups").insert([
      {
        wedding_id: wedding.id,
        name: body.name,
        phone_number: body.phoneNumber || null,
        tags: body.tags || [],
        notes: body.notes || null,
        invited_by: body.invitedBy || [],
      },
    ]).select().single()

    if (error) {
      console.error('Guest group insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Guest group POST error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PUT update a guest group
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const updateData: Record<string, any> = {
      name: body.name,
      phone_number: body.phoneNumber,
      tags: body.tags,
      notes: body.notes,
      invited_by: body.invitedBy || [],
      updated_at: new Date().toISOString(),
    }

    // Handle invitation status
    if (body.invitationSent !== undefined) {
      updateData.invitation_sent = body.invitationSent
      if (body.invitationSent) {
        updateData.invitation_sent_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from("guest_groups")
      .update(updateData)
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

// DELETE a guest group
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from("guest_groups")
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
