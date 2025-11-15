import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/weddings/[dateId]/[weddingNameId]/config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dateId: string; weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { dateId, weddingNameId } = await params

    console.log('GET /api/weddings/config - dateId:', dateId, 'weddingNameId:', weddingNameId)

    const { data: wedding, error } = await supabase
      .from('weddings')
      .select('page_config')
      .eq('date_id', dateId)
      .eq('wedding_name_id', weddingNameId)
      .single()

    if (error) {
      console.error('Error fetching wedding config:', error)
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }

    return NextResponse.json({
      config: wedding.page_config || {}
    })

  } catch (error) {
    console.error('Error in GET /api/weddings/config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/weddings/[dateId]/[weddingNameId]/config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ dateId: string; weddingNameId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { dateId, weddingNameId } = await params
    
    console.log('PUT /api/weddings/config - dateId:', dateId, 'weddingNameId:', weddingNameId)
    
    // Debug: Show all weddings
    const { data: allWeddings } = await supabase
      .from('weddings')
      .select('id, date_id, wedding_name_id, partner1_first_name, partner2_first_name, owner_id')
    
    console.log('All weddings in database:', allWeddings)
    
    // First, check if the wedding exists
    const { data: existingWedding, error: findError } = await supabase
      .from('weddings')
      .select('id, date_id, wedding_name_id, owner_id')
      .eq('date_id', dateId)
      .eq('wedding_name_id', weddingNameId)
      .single()
    
    if (findError || !existingWedding) {
      console.log('Wedding not found:', findError)
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 })
    }
    
    console.log('Found wedding:', existingWedding)
    
    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid configuration data' }, { status: 400 })
    }

    const { data: updatedWeddings, error } = await supabase
      .from('weddings')
      .update({
        page_config: config,
        updated_at: new Date().toISOString()
      })
      .eq('date_id', dateId)
      .eq('wedding_name_id', weddingNameId)
      .select('id, page_config')

    if (error) {
      console.error('Error updating wedding config:', error)
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }

    if (!updatedWeddings || updatedWeddings.length === 0) {
      console.error('No rows updated - wedding might not exist')
      return NextResponse.json({ error: 'Wedding not found or update failed' }, { status: 404 })
    }

    const wedding = updatedWeddings[0]

    return NextResponse.json({
      success: true,
      config: wedding.page_config,
      message: 'Configuration saved successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/weddings/config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}