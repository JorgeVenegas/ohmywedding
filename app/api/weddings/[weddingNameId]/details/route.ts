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
    const { weddingNameId } = await params

    const { data: wedding, error } = await supabase
      .from('weddings')
      .select(`
        partner1_first_name,
        partner1_last_name,
        partner2_first_name,
        partner2_last_name,
        wedding_date,
        wedding_time,
        ceremony_venue_name,
        ceremony_venue_address,
        reception_venue_name,
        reception_venue_address
      `)
      .eq('wedding_name_id', weddingNameId)
      .single()

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
    
    if (!isOwner && !isCollaborator) {
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
