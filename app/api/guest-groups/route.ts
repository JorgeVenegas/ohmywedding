import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET all guest groups for a wedding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawWeddingNameId = searchParams.get('weddingNameId')

    if (!rawWeddingNameId) {
      return NextResponse.json({ error: "weddingNameId is required" }, { status: 400 })
    }

    // Decode the weddingNameId in case it's URL encoded
    const weddingNameId = decodeURIComponent(rawWeddingNameId)

    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from("guest_groups")
      .select(`
        *,
        guests (*)
      `)
      .eq("wedding_name_id", weddingNameId)
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

    // Decode the weddingNameId in case it's URL encoded
    const weddingNameId = decodeURIComponent(body.weddingNameId)

    // Debug: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Guest groups POST - Auth check:', { 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError?.message,
      weddingNameId,
      originalWeddingNameId: body.weddingNameId
    })

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Debug: Check the wedding ownership
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('owner_id, collaborator_emails')
      .eq('wedding_name_id', weddingNameId)
      .single()
    
    console.log('Guest groups POST - Wedding check:', {
      wedding,
      weddingError: weddingError?.message,
      isOwner: wedding?.owner_id === user.id,
      isCollaborator: wedding?.collaborator_emails?.includes(user.email || ''),
      isUnowned: wedding?.owner_id === null
    })

    const { data, error } = await supabase.from("guest_groups").insert([
      {
        wedding_name_id: weddingNameId,
        name: body.name,
        phone_number: body.phoneNumber || null,
        tags: body.tags || [],
        notes: body.notes || null,
        invited_by: body.invitedBy || [],
      },
    ]).select().single()

    if (error) {
      console.log('Guest groups POST - Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Guest groups POST - Exception:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update a guest group
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("guest_groups")
      .update({
        name: body.name,
        phone_number: body.phoneNumber,
        tags: body.tags,
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
