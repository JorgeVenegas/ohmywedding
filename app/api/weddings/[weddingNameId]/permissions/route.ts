import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type WeddingPermissions = {
  canEdit: boolean
  canDelete: boolean
  canManageCollaborators: boolean
  isOwner: boolean
  isCollaborator: boolean
  role: 'owner' | 'editor' | 'guest'
  userId: string | null
}

// GET /api/weddings/[weddingNameId]/permissions - Check user permissions for a wedding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId: rawWeddingNameId } = await params
    const weddingNameId = decodeURIComponent(rawWeddingNameId)

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

    // Get wedding info
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('owner_id, is_demo')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    // Try to get collaborator_emails if the column exists
    let collaboratorEmails: string[] = []
    try {
      const { data: weddingWithCollabs } = await supabase
        .from('weddings')
        .select('collaborator_emails')
        .eq('wedding_name_id', weddingNameId)
        .single()
      
      if (weddingWithCollabs?.collaborator_emails) {
        collaboratorEmails = weddingWithCollabs.collaborator_emails
      }
    } catch {
      // Column doesn't exist yet, ignore
    }

    // No user logged in - guests cannot edit
    if (!user) {
      const permissions: WeddingPermissions = {
        canEdit: false,
        canDelete: false,
        canManageCollaborators: false,
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
      const { data: superuserCheck } = await supabase
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

    const permissions: WeddingPermissions = {
      canEdit: isOwner || isCollaborator || isSuperuser,
      canDelete: isOwner || isSuperuser,
      canManageCollaborators: isOwner || isSuperuser,
      isOwner: isOwner || isSuperuser,
      isCollaborator,
      role,
      userId: user.id
    }

    const response = NextResponse.json({ permissions })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response

  } catch (error) {
    console.error('Error in GET /api/weddings/permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
