import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const decodedWeddingId = decodeURIComponent(weddingId)
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminSupabaseClient()

    const { data: wedding, error } = await adminClient
      .from("weddings")
      .select("id, owner_id, collaborator_emails, is_ready, ready_status_managed_by")
      .eq("wedding_name_id", decodedWeddingId)
      .single()

    if (error || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() || '') || false

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const canManage = isOwner || (wedding.ready_status_managed_by === 'all' && isCollaborator)

    return NextResponse.json({
      is_ready: wedding.is_ready,
      ready_status_managed_by: wedding.ready_status_managed_by,
      canManage,
      isOwner,
    })
  } catch (error) {
    console.error("[ready-status GET] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const { weddingId } = await params
    const decodedWeddingId = decodeURIComponent(weddingId)
    const body = await request.json()
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminSupabaseClient()

    const { data: wedding, error } = await adminClient
      .from("weddings")
      .select("id, owner_id, collaborator_emails, is_ready, ready_status_managed_by")
      .eq("wedding_name_id", decodedWeddingId)
      .single()

    if (error || !wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 })
    }

    const isOwner = wedding.owner_id === user.id
    const isCollaborator = wedding.collaborator_emails?.includes(user.email?.toLowerCase() || '') || false

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: Record<string, any> = {}

    // is_ready can be changed by owner or by anyone if ready_status_managed_by === 'all'
    if ('is_ready' in body) {
      const canManage = isOwner || (wedding.ready_status_managed_by === 'all' && isCollaborator)
      if (!canManage) {
        return NextResponse.json({ error: "Only the owner can change the wedding status" }, { status: 403 })
      }
      updateData.is_ready = Boolean(body.is_ready)
    }

    // ready_status_managed_by can only be changed by the owner
    if ('ready_status_managed_by' in body) {
      if (!isOwner) {
        return NextResponse.json({ error: "Only the owner can change who manages the wedding status" }, { status: 403 })
      }
      if (!['owner', 'all'].includes(body.ready_status_managed_by)) {
        return NextResponse.json({ error: "Invalid value for ready_status_managed_by" }, { status: 400 })
      }
      updateData.ready_status_managed_by = body.ready_status_managed_by
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data: updated, error: updateError } = await adminClient
      .from("weddings")
      .update(updateData)
      .eq("id", wedding.id)
      .select("is_ready, ready_status_managed_by")
      .single()

    if (updateError) {
      console.error("[ready-status PATCH] error:", updateError)
      return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...updated })
  } catch (error) {
    console.error("[ready-status PATCH] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
