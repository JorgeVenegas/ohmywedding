import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/weddings/[weddingNameId]/details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId: rawWeddingNameId } = await params
    
    // Decode the weddingNameId in case it's URL encoded
    const weddingNameId = decodeURIComponent(rawWeddingNameId)

    // Check if it's a UUID or wedding_name_id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingNameId)
    
    let query = supabase
      .from('weddings')
      .select(`
        partner1_first_name,
        partner1_last_name,
        partner2_first_name,
        partner2_last_name,
        wedding_date,
        wedding_time,
        reception_time,
        ceremony_venue_name,
        ceremony_venue_address,
        reception_venue_name,
        reception_venue_address,
        wedding_name_id,
        page_config
      `)
    
    // Query by id if UUID, otherwise by wedding_name_id
    if (isUuid) {
      query = query.eq('id', weddingNameId)
    } else {
      query = query.eq('wedding_name_id', weddingNameId)
    }
    
    const { data: wedding, error } = await query.single()

    if (error) {
      console.error('Error fetching wedding details:', error)
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    return NextResponse.json({ details: wedding })

  } catch (error) {
    console.error('Error in GET /api/weddings/details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/weddings/[weddingNameId]/details - For updating page_config
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId: rawWeddingNameId } = await params
    const weddingNameId = decodeURIComponent(rawWeddingNameId)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if it's a UUID or wedding_name_id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(weddingNameId)
    
    // First, check if the wedding exists
    let existingQuery = supabase
      .from('weddings')
      .select('id, owner_id, collaborator_emails, page_config')
    
    if (isUuid) {
      existingQuery = existingQuery.eq('id', weddingNameId)
    } else {
      existingQuery = existingQuery.eq('wedding_name_id', weddingNameId)
    }
    
    const { data: existingWedding, error: findError } = await existingQuery.single()
    
    if (findError || !existingWedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }
    
    // Check permissions
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 })
    }
    
    const isOwner = existingWedding.owner_id === user.id
    const isCollaborator = existingWedding.collaborator_emails?.includes(user.email?.toLowerCase() || '')
    
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
      return NextResponse.json({ error: 'Forbidden - you do not have permission to edit this wedding' }, { status: 403 })
    }
    
    const body = await request.json()
    const { page_config } = body

    if (!page_config || typeof page_config !== 'object') {
      return NextResponse.json({ error: 'Invalid page_config data' }, { status: 400 })
    }

    // Merge the new page_config with existing
    const mergedConfig = {
      ...(existingWedding.page_config || {}),
      ...page_config
    }

    // Update the wedding with merged page_config
    let updateQuery = supabase
      .from('weddings')
      .update({
        page_config: mergedConfig,
        updated_at: new Date().toISOString()
      })
    
    if (isUuid) {
      updateQuery = updateQuery.eq('id', weddingNameId)
    } else {
      updateQuery = updateQuery.eq('wedding_name_id', weddingNameId)
    }

    const { data: updatedWedding, error } = await updateQuery
      .select('page_config')
      .single()

    if (error) {
      console.error('Error updating page_config:', error)
      return NextResponse.json({ error: 'Failed to save page_config' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      page_config: updatedWedding.page_config
    })

  } catch (error) {
    console.error('Error in PATCH /api/weddings/details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/weddings/[weddingNameId]/details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { weddingNameId } = await params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // First, check if the wedding exists
    const { data: existingWedding, error: findError } = await supabase
      .from('weddings')
      .select('id, owner_id')
      .eq('wedding_name_id', weddingNameId)
      .single()
    
    if (findError || !existingWedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }
    
    // Check permissions
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 })
    }
    
    const isOwner = existingWedding.owner_id === user.id
    
    // Check if user is a collaborator
    let isCollaborator = false
    try {
      const { data: weddingWithCollabs } = await supabase
        .from('weddings')
        .select('collaborator_emails')
        .eq('wedding_name_id', weddingNameId)
        .single()
      
      if (weddingWithCollabs?.collaborator_emails && user.email) {
        isCollaborator = weddingWithCollabs.collaborator_emails.includes(user.email.toLowerCase())
      }
    } catch {
      // Column doesn't exist yet
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
    
    if (!isOwner && !isCollaborator && !isSuperuser) {
      return NextResponse.json({ error: 'Forbidden - you do not have permission to edit this wedding' }, { status: 403 })
    }
    
    const body = await request.json()
    const { details } = body

    if (!details || typeof details !== 'object') {
      return NextResponse.json({ error: 'Invalid details data' }, { status: 400 })
    }

    // Only update allowed fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    const allowedFields = [
      'partner1_first_name',
      'partner1_last_name',
      'partner2_first_name',
      'partner2_last_name',
      'wedding_date',
      'wedding_time',
      'reception_time',
      'ceremony_venue_name',
      'ceremony_venue_address',
      'reception_venue_name',
      'reception_venue_address'
    ]

    for (const field of allowedFields) {
      if (field in details) {
        updateData[field] = details[field] || null
      }
    }

    const { data: updatedWedding, error } = await supabase
      .from('weddings')
      .update(updateData)
      .eq('wedding_name_id', weddingNameId)
      .select()
      .single()

    if (error) {
      console.error('Error updating wedding details:', error)
      return NextResponse.json({ error: 'Failed to save wedding details' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      details: updatedWedding
    })

  } catch (error) {
    console.error('Error in PUT /api/weddings/details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
