import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export interface CollaboratorPermissions {
  can_edit_details: boolean
  can_edit_page_design: boolean
  can_manage_guests: boolean
  can_view_guests: boolean
  can_manage_invitations: boolean
  can_view_invitations: boolean
  can_manage_registry: boolean
  can_view_registry: boolean
  can_manage_gallery: boolean
  can_view_gallery: boolean
  can_manage_rsvps: boolean
  can_view_rsvps: boolean
  can_manage_collaborators: boolean
}

// GET /api/weddings/[weddingId]/collaborators/[email]/permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string; email: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingId, email } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get wedding ID
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, owner_id')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    const decodedEmail = decodeURIComponent(email).toLowerCase()

    // Check if requesting user is owner or the collaborator themselves
    const isOwner = wedding.owner_id === user.id
    const isSelf = user.email?.toLowerCase() === decodedEmail

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get permissions
    const { data: permissions, error: permError } = await supabase
      .from('collaborator_permissions')
      .select('*')
      .eq('wedding_id', wedding.id)
      .eq('collaborator_email', decodedEmail)
      .single()

    if (permError && permError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching permissions:', permError)
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
    }

    // If no permissions found, return default read-only
    if (!permissions) {
      return NextResponse.json({
        can_edit_details: false,
        can_edit_page_design: false,
        can_manage_guests: false,
        can_view_guests: true,
        can_manage_invitations: false,
        can_view_invitations: true,
        can_manage_registry: false,
        can_view_registry: true,
        can_manage_gallery: false,
        can_view_gallery: true,
        can_manage_rsvps: false,
        can_view_rsvps: true,
        can_manage_collaborators: false
      })
    }

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error in GET permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/weddings/[weddingId]/collaborators/[email]/permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string; email: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingId, email } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get wedding ID
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, owner_id')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    // Only owner can update permissions
    if (wedding.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the owner can update permissions' }, { status: 403 })
    }

    const decodedEmail = decodeURIComponent(email).toLowerCase()
    const body = await request.json()
    const permissions: Partial<CollaboratorPermissions> = body

    // Upsert permissions
    const { data, error: upsertError } = await supabase
      .from('collaborator_permissions')
      .upsert({
        wedding_id: wedding.id,
        collaborator_email: decodedEmail,
        ...permissions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wedding_id,collaborator_email'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error updating permissions:', upsertError)
      return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
