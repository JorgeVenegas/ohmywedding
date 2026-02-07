import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { requireFeature } from "@/lib/subscription-api"
import { getWeddingFeatureLimit } from "@/lib/subscription"

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
    
    // No plan check on GET - free users can browse their guest list
    // Write operations (POST/PUT/DELETE) are plan-gated

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
    
    // Check premium access for guest management
    const featureCheck = await requireFeature('invitations_panel_enabled', decodedWeddingId)
    if (!featureCheck.allowed) {
      return featureCheck.response
    }

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
      return NextResponse.json({ error: `Wedding lookup failed: ${weddingError.message}` }, { status: 500 })
    }
    
    if (!wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    // Check guest group limit for wedding's plan
    const groupLimit = await getWeddingFeatureLimit(wedding.id, 'guest_groups_limit')
    if (groupLimit !== null) {
      // Count current groups (exclude drafts from the count)
      const { count: currentGroupCount } = await supabase
        .from('guest_groups')
        .select('*', { count: 'exact', head: true })
        .eq('wedding_id', wedding.id)
        .eq('is_draft', false)
      
      if ((currentGroupCount || 0) >= groupLimit) {
        return NextResponse.json({ 
          error: `Guest group limit reached. Your plan allows ${groupLimit} groups. Upgrade to add more.`,
          code: 'GROUP_LIMIT_EXCEEDED',
          limit: groupLimit,
          current: currentGroupCount || 0
        }, { status: 403 })
      }
    }

    const rawName = typeof body.name === 'string' ? body.name : null

    // Determine if this is a draft group (no name provided or isDraft flag)
    const isDraft = body.isDraft === true || !rawName || rawName.trim() === ''

    const { data, error } = await supabase.from("guest_groups").insert([
      {
        wedding_id: wedding.id,
        name: rawName,
        phone_number: body.phoneNumber || null,
        notes: body.notes || null,
        is_draft: isDraft,
      },
    ]).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
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

    // Check premium access for guest management
    if (body.weddingId) {
      const featureCheck = await requireFeature('invitations_panel_enabled', decodeURIComponent(body.weddingId))
      if (!featureCheck.allowed) {
        return featureCheck.response
      }
    }

    const updateData: Record<string, any> = {
      name: body.name,
      phone_number: body.phoneNumber,
      notes: body.notes,
      updated_at: new Date().toISOString(),
    }

    // If name is being set and it's not empty, mark as not draft
    if (body.name && body.name.trim() !== '') {
      updateData.is_draft = false
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
    const weddingId = searchParams.get('weddingId')

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Check premium access for guest management
    if (weddingId) {
      const featureCheck = await requireFeature('invitations_panel_enabled', decodeURIComponent(weddingId))
      if (!featureCheck.allowed) {
        return featureCheck.response
      }
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
