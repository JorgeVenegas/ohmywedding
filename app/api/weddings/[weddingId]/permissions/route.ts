import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient, getCollaboratorPermissions } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type WeddingPermissions = {
  canEdit: boolean
  canDelete: boolean
  canManageCollaborators: boolean
  canManageInvitations: boolean
  canManageGuests: boolean
  isOwner: boolean
  isCollaborator: boolean
  role: 'owner' | 'editor' | 'guest'
  userId: string | null
}

// GET /api/weddings/[weddingId]/permissions - Check user permissions for a wedding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingId: rawWeddingId } = await params
    const weddingId = decodeURIComponent(rawWeddingId)

    // Try to get user from cookies first
    let { data: { user } } = await supabase.auth.getUser()
    
    // If no user from cookies, try Authorization header
    if (!user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data } = await supabase.auth.getUser(token)
        user = data.user
      }
    }

    const adminClient = createAdminSupabaseClient()

    // Get wedding info using admin client to avoid RLS issues
    const { data: wedding, error: weddingError } = await adminClient
      .from('weddings')
      .select('id, owner_id, is_demo, collaborator_emails')
      .eq('wedding_name_id', weddingId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    const collaboratorEmails: string[] = wedding.collaborator_emails || []

    // No user logged in - guests cannot edit
    if (!user) {
      const permissions: WeddingPermissions = {
        canEdit: false,
        canDelete: false,
        canManageCollaborators: false,
        canManageInvitations: false,
        canManageGuests: false,
        isOwner: false,
        isCollaborator: false,
        role: 'guest',
        userId: null
      }
      return NextResponse.json({ permissions })
    }

    // User is logged in
    const isOwner = wedding.owner_id === user.id
    
    // Check if user is a superuser (has all permissions)
    let isSuperuser = false
    if (user.email) {
      const { data: superuserCheck } = await adminClient
        .from('superusers')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .eq('is_active', true)
        .single()
      isSuperuser = !!superuserCheck
    }
    
    // Check if user is a collaborator by email
    const isCollaborator = user.email ? collaboratorEmails.includes(user.email.toLowerCase()) : false

    // Superusers have all permissions, including editing demo weddings
    let role: WeddingPermissions['role'] = 'guest'
    if (isOwner || isSuperuser) role = 'owner'
    else if (isCollaborator) role = 'editor'

    // For collaborators, fetch granular permissions
    let granularPermissions = null
    if (isCollaborator && !isOwner && !isSuperuser) {
      granularPermissions = await getCollaboratorPermissions(wedding.id, user.email!)
    }

    const permissions: WeddingPermissions = {
      canEdit: isOwner || isSuperuser || (isCollaborator && (granularPermissions?.can_edit_page_design ?? false)),
      canDelete: isOwner || isSuperuser,
      canManageCollaborators: isOwner || isSuperuser || (isCollaborator && (granularPermissions?.can_manage_collaborators ?? false)),
      canManageInvitations: isOwner || isSuperuser || (isCollaborator && (granularPermissions?.can_manage_invitations ?? false)),
      canManageGuests: isOwner || isSuperuser || (isCollaborator && (granularPermissions?.can_manage_guests ?? false)),
      isOwner: isOwner || isSuperuser,
      isCollaborator,
      role,
      userId: user.id
    }

    const response = NextResponse.json({ 
      permissions,
      ...(granularPermissions ? { granularPermissions } : {})
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
