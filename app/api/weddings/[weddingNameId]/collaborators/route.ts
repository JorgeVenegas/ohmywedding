import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/weddings/[weddingNameId]/collaborators - List collaborators
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId } = await params

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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get wedding - first try with collaborator_emails, fallback to just owner_id
    let wedding: { owner_id: string | null; collaborator_emails?: string[] } | null = null
    
    const { data: weddingData, error } = await supabase
      .from('weddings')
      .select('owner_id')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (error || !weddingData) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    wedding = { owner_id: weddingData.owner_id, collaborator_emails: [] }

    // Try to get collaborator_emails if the column exists
    try {
      const { data: weddingWithCollabs } = await supabase
        .from('weddings')
        .select('collaborator_emails')
        .eq('wedding_name_id', weddingNameId)
        .single()
      
      if (weddingWithCollabs?.collaborator_emails) {
        wedding.collaborator_emails = weddingWithCollabs.collaborator_emails
      }
    } catch {
      // Column doesn't exist yet, ignore
    }

    const isOwner = wedding.owner_id === user.id
    const collaboratorEmails = wedding.collaborator_emails || []
    const isCollaborator = collaboratorEmails.includes(user.email || '')
    
    // Check if user is a superuser
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

    if (!isOwner && !isCollaborator && !isSuperuser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      collaboratorEmails,
      isOwner,
      ownerId: wedding.owner_id
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/weddings/[weddingNameId]/collaborators - Add collaborator email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId } = await params

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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the owner
    const { data: weddingData, error: findError } = await supabase
      .from('weddings')
      .select('owner_id')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (findError || !weddingData) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    // Check if user is a superuser
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

    if (weddingData.owner_id !== user.id && !isSuperuser) {
      return NextResponse.json({ error: 'Only the owner can add collaborators' }, { status: 403 })
    }

    // Get current collaborator emails
    let currentEmails: string[] = []
    try {
      const { data: weddingWithCollabs } = await supabase
        .from('weddings')
        .select('collaborator_emails')
        .eq('wedding_name_id', weddingNameId)
        .single()
      
      if (weddingWithCollabs?.collaborator_emails) {
        currentEmails = weddingWithCollabs.collaborator_emails
      }
    } catch {
      // Column doesn't exist yet
      return NextResponse.json({ error: 'Collaborator feature not available. Please run database migration.' }, { status: 500 })
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if already a collaborator
    if (currentEmails.includes(trimmedEmail)) {
      return NextResponse.json({ error: 'Email is already a collaborator' }, { status: 400 })
    }

    // Add collaborator email
    const updatedEmails = [...currentEmails, trimmedEmail]
    
    const { error: updateError } = await supabase
      .from('weddings')
      .update({ 
        collaborator_emails: updatedEmails,
        updated_at: new Date().toISOString()
      })
      .eq('wedding_name_id', weddingNameId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      collaboratorEmails: updatedEmails 
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/weddings/[weddingNameId]/collaborators - Remove collaborator email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId } = await params

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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Get wedding owner first
    const { data: weddingData, error: findError } = await supabase
      .from('weddings')
      .select('owner_id')
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (findError || !weddingData) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    // Check if user is a superuser
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

    // Allow removal if owner, superuser, or if removing yourself
    const isOwner = weddingData.owner_id === user.id
    const isSelf = user.email?.toLowerCase() === trimmedEmail

    if (!isOwner && !isSelf && !isSuperuser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get current collaborator emails
    let currentEmails: string[] = []
    try {
      const { data: weddingWithCollabs } = await supabase
        .from('weddings')
        .select('collaborator_emails')
        .eq('wedding_name_id', weddingNameId)
        .single()
      
      if (weddingWithCollabs?.collaborator_emails) {
        currentEmails = weddingWithCollabs.collaborator_emails
      }
    } catch {
      // Column doesn't exist yet
      return NextResponse.json({ error: 'Collaborator feature not available. Please run database migration.' }, { status: 500 })
    }

    // Remove collaborator email
    const updatedEmails = currentEmails.filter((e: string) => e.toLowerCase() !== trimmedEmail)

    const { error: updateError } = await supabase
      .from('weddings')
      .update({ 
        collaborator_emails: updatedEmails,
        updated_at: new Date().toISOString()
      })
      .eq('wedding_name_id', weddingNameId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      collaboratorEmails: updatedEmails 
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
